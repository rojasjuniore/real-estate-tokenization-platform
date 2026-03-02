import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/dividends/[id] - Get dividend details with holders breakdown
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const dividend = await prisma.dividend.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true,
            totalFractions: true,
            availableFractions: true,
            pricePerFraction: true,
            images: true,
          }
        },
        claims: {
          select: {
            id: true,
            userAddress: true,
            amount: true,
            claimed: true,
            claimedAt: true,
            txHash: true,
          },
          orderBy: {
            amount: 'desc'
          }
        }
      }
    });

    if (!dividend) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dividend not found' } },
        { status: 404 }
      );
    }

    // Get user info for each claim
    const userAddresses = dividend.claims.map(c => c.userAddress);
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: userAddresses } },
      select: {
        walletAddress: true,
        name: true,
        email: true,
      }
    });

    const userMap = new Map(users.map(u => [u.walletAddress, u]));

    // Get portfolio info for token amounts
    const portfolios = await prisma.portfolio.findMany({
      where: {
        propertyId: dividend.propertyId,
        user: { walletAddress: { in: userAddresses } }
      },
      include: {
        user: {
          select: { walletAddress: true }
        }
      }
    });

    const portfolioMap = new Map(portfolios.map(p => [p.user.walletAddress, p.tokenAmount]));

    // Enrich claims with user info and token amounts
    const enrichedClaims = dividend.claims.map(claim => ({
      id: claim.id,
      userAddress: claim.userAddress,
      userName: userMap.get(claim.userAddress)?.name || null,
      userEmail: userMap.get(claim.userAddress)?.email || null,
      tokenAmount: portfolioMap.get(claim.userAddress) || 0,
      dividendAmount: Number(claim.amount),
      claimed: claim.claimed,
      claimedAt: claim.claimedAt,
      txHash: claim.txHash,
    }));

    // Calculate stats
    const totalHolders = dividend.claims.length;
    const claimedCount = dividend.claims.filter(c => c.claimed).length;
    const pendingCount = totalHolders - claimedCount;
    const totalClaimableAmount = dividend.claims.reduce((sum, c) => sum + Number(c.amount), 0);
    const claimedAmount = dividend.claims.filter(c => c.claimed).reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingAmount = totalClaimableAmount - claimedAmount;
    const totalTokensHeld = enrichedClaims.reduce((sum, c) => sum + c.tokenAmount, 0);

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        id: dividend.id,
        propertyId: dividend.propertyId,
        property: dividend.property,
        totalAmount: Number(dividend.totalAmount),
        amountPerToken: Number(dividend.amountPerToken),
        paymentToken: dividend.paymentToken,
        period: dividend.period,
        status: dividend.status,
        approvalTxHash: dividend.approvalTxHash,
        txHash: dividend.txHash,
        distributedAt: dividend.distributedAt,
        createdAt: dividend.createdAt,
        stats: {
          totalHolders,
          claimedCount,
          pendingCount,
          claimPercentage: totalHolders > 0 ? (claimedCount / totalHolders) * 100 : 0,
          totalClaimableAmount,
          claimedAmount,
          pendingAmount,
          totalTokensHeld,
        },
        holders: enrichedClaims,
      })
    });
  } catch (error) {
    console.error('Dividend detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_DETAIL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/dividends/[id] - Cancel a pending dividend
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    const dividend = await prisma.dividend.findUnique({
      where: { id }
    });

    if (!dividend) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dividend not found' } },
        { status: 404 }
      );
    }

    if (dividend.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Can only cancel pending dividends' } },
        { status: 400 }
      );
    }

    // Check if any claims have been made
    const claimedCount = await prisma.dividendClaim.count({
      where: { dividendId: id, claimed: true }
    });

    if (claimedCount > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'HAS_CLAIMS', message: 'Cannot cancel dividend with existing claims' } },
        { status: 400 }
      );
    }

    // Cancel dividend and delete claims
    await prisma.$transaction([
      prisma.dividendClaim.deleteMany({ where: { dividendId: id } }),
      prisma.dividend.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: { message: 'Dividend cancelled successfully' }
    });
  } catch (error) {
    console.error('Dividend cancel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_CANCEL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
