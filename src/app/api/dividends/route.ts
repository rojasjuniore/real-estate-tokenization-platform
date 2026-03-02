import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeBigInt } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Wallet address required'
          }
        },
        { status: 401 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Get user's portfolio to find their properties
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        portfolio: {
          include: {
            property: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        },
        { status: 404 }
      );
    }

    const propertyIds = user.portfolio.map(p => p.propertyId);

    // Get pending dividends for user's properties
    const pendingDividends = await prisma.dividend.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'DISTRIBUTED'
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true
          }
        },
        claims: {
          where: {
            userAddress: normalizedAddress,
            claimed: false
          }
        }
      }
    });

    // Calculate claimable amounts
    const claimableDividends = pendingDividends
      .filter(d => d.claims.length > 0 && d.onChainDistributionId !== null)
      .map(d => {
        const claim = d.claims[0];
        return {
          id: d.id,
          property: d.property,
          period: d.period,
          amount: claim.amount,
          claimId: claim.id,
          onChainDistributionId: d.onChainDistributionId,
          distributedAt: d.distributedAt
        };
      });

    const totalClaimable = claimableDividends.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    );

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        dividends: claimableDividends,
        totalClaimable: totalClaimable.toFixed(2)
      })
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Dividends fetch error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDENDS_FETCH_ERROR',
          message: 'Failed to fetch dividends'
        }
      },
      { status: 500 }
    );
  }
}
