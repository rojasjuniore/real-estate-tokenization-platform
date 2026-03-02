import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, totalAmount, paymentToken, period } = body;

    if (!propertyId || !totalAmount || !paymentToken || !period) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: propertyId, totalAmount, paymentToken, period'
          }
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROPERTY_NOT_FOUND',
            message: 'Property not found'
          }
        },
        { status: 404 }
      );
    }

    const soldFractions = property.totalFractions - property.availableFractions;

    if (soldFractions === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_HOLDERS',
            message: 'Property has no token holders'
          }
        },
        { status: 400 }
      );
    }

    const amountPerToken = Number(totalAmount) / soldFractions;

    const dividend = await prisma.dividend.create({
      data: {
        propertyId,
        totalAmount: Number(totalAmount),
        amountPerToken,
        paymentToken,
        period,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true
          }
        }
      }
    });

    const holders = await prisma.portfolio.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            walletAddress: true
          }
        }
      }
    });

    const claims = holders.map(holder => ({
      dividendId: dividend.id,
      userAddress: holder.user.walletAddress,
      amount: amountPerToken * holder.tokenAmount,
      claimed: false
    }));

    await prisma.dividendClaim.createMany({
      data: claims
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        dividend,
        claimsCreated: claims.length,
        totalHolders: holders.length
      })
    });
  } catch (error) {
    console.error('Dividend create error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const dividends = await prisma.dividend.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true
          }
        },
        claims: {
          select: {
            id: true,
            claimed: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const dividendsWithStats = dividends.map(dividend => {
      const totalClaims = dividend.claims.length;
      const claimedCount = dividend.claims.filter(c => c.claimed).length;
      const claimedAmount = dividend.claims
        .filter(c => c.claimed)
        .reduce((sum, c) => sum + Number(c.amount), 0);

      return {
        ...dividend,
        stats: {
          totalHolders: totalClaims,
          claimedCount,
          claimedAmount,
          claimPercentage: totalClaims > 0 ? (claimedCount / totalClaims) * 100 : 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(dividendsWithStats)
    });
  } catch (error) {
    console.error('Dividend list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
