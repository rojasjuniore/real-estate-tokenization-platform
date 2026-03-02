import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

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

    // Get claimed dividends
    const [claims, total] = await Promise.all([
      prisma.dividendClaim.findMany({
        where: {
          userAddress: normalizedAddress,
          claimed: true
        },
        include: {
          dividend: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  tokenId: true
                }
              }
            }
          }
        },
        orderBy: { claimedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dividendClaim.count({
        where: {
          userAddress: normalizedAddress,
          claimed: true
        }
      })
    ]);

    const history = claims.map(claim => ({
      id: claim.id,
      property: claim.dividend.property,
      period: claim.dividend.period,
      amount: claim.amount,
      txHash: claim.txHash,
      claimedAt: claim.claimedAt
    }));

    const totalClaimed = claims.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        history,
        totalClaimed: totalClaimed.toFixed(2)
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Dividend history error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_HISTORY_ERROR',
          message: 'Failed to fetch dividend history'
        }
      },
      { status: 500 }
    );
  }
}
