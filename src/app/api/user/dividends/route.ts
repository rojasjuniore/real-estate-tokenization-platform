import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_WALLET',
            message: 'Wallet address is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid wallet address format',
          },
        },
        { status: 400 }
      );
    }

    const normalizedAddress = wallet.toLowerCase();

    // Get user's dividend claims with dividend and property info
    const claims = await prisma.dividendClaim.findMany({
      where: { userAddress: normalizedAddress },
      include: {
        dividend: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                tokenId: true,
              },
            },
          },
        },
      },
    });

    // Sort by dividend distributedAt descending
    const sortedClaims = claims.sort((a, b) => {
      const dateA = a.dividend.distributedAt?.getTime() || 0;
      const dateB = b.dividend.distributedAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Transform data to match panel expectations
    const data = sortedClaims.map((claim) => ({
      id: claim.id,
      dividendId: claim.dividend.id,
      onChainDistributionId: claim.dividend.onChainDistributionId,
      propertyId: claim.dividend.propertyId,
      property: {
        name: claim.dividend.property.name,
        tokenId: claim.dividend.property.tokenId,
      },
      amount: claim.amount.toString(),
      paymentToken: claim.dividend.paymentToken || 'USDT',
      status: claim.claimed ? 'CLAIMED' : (claim.dividend.onChainDistributionId ? 'CLAIMABLE' : 'PENDING'),
      distributedAt: claim.dividend.distributedAt?.toISOString() || claim.dividend.createdAt.toISOString(),
      claimedAt: claim.claimedAt?.toISOString() || null,
      txHash: claim.txHash || null,
    }));

    return NextResponse.json({
      success: true,
      data: serializeBigInt(data),
    });
  } catch (error) {
    console.error('Error fetching dividends:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dividends',
        },
      },
      { status: 500 }
    );
  }
}
