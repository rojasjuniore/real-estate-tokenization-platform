import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    // Verify KYC is approved
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { kycStatus: true }
    });

    if (!user || user.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KYC_REQUIRED',
            message: 'KYC verification required to claim dividends'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { distributionId, claimIds } = body;

    if (!distributionId && (!claimIds || claimIds.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'distributionId or claimIds required'
          }
        },
        { status: 400 }
      );
    }

    // Get claims to process
    let claims;
    if (claimIds && claimIds.length > 0) {
      claims = await prisma.dividendClaim.findMany({
        where: {
          id: { in: claimIds },
          userAddress: normalizedAddress,
          claimed: false
        },
        include: {
          dividend: true
        }
      });
    } else {
      claims = await prisma.dividendClaim.findMany({
        where: {
          dividend: { id: distributionId },
          userAddress: normalizedAddress,
          claimed: false
        },
        include: {
          dividend: true
        }
      });
    }

    if (claims.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CLAIMS_FOUND',
            message: 'No pending claims found'
          }
        },
        { status: 404 }
      );
    }

    // Calculate total amount to claim
    const totalAmount = claims.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    // Prepare transaction data for the frontend to execute
    // The actual claim happens on-chain via RoyaltyDistributor contract
    const distributionIds = [...new Set(claims.map(c => c.dividend.id))];

    return NextResponse.json({
      success: true,
      data: {
        claimIds: claims.map(c => c.id),
        distributionIds,
        totalAmount: totalAmount.toFixed(2),
        paymentToken: claims[0].dividend.paymentToken,
        // The frontend will use this data to call the smart contract
        contractCall: {
          functionName: distributionIds.length === 1
            ? 'claimDividend'
            : 'claimAllDividends',
          args: distributionIds.length === 1
            ? [distributionIds[0]]
            : [distributionIds]
        }
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Claim preparation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLAIM_PREP_ERROR',
          message: 'Failed to prepare claim'
        }
      },
      { status: 500 }
    );
  }
}

// Called after successful on-chain claim to update database
export async function PUT(request: NextRequest) {
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

    // Verify KYC is approved
    const userCheck = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { kycStatus: true }
    });

    if (!userCheck || userCheck.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KYC_REQUIRED',
            message: 'KYC verification required to claim dividends'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { claimIds, txHash } = body;

    if (!claimIds || claimIds.length === 0 || !txHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'claimIds and txHash required'
          }
        },
        { status: 400 }
      );
    }

    // Update claims as completed
    await prisma.dividendClaim.updateMany({
      where: {
        id: { in: claimIds },
        userAddress: normalizedAddress,
        claimed: false
      },
      data: {
        claimed: true,
        txHash,
        claimedAt: new Date()
      }
    });

    // Record transaction
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    });

    if (user) {
      const claims = await prisma.dividendClaim.findMany({
        where: { id: { in: claimIds } },
        include: { dividend: true }
      });

      const totalAmount = claims.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      );

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DIVIDEND_CLAIM',
          txHash,
          amount: totalAmount,
          paymentToken: claims[0]?.dividend.paymentToken || 'USDT',
          status: 'CONFIRMED'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        claimed: claimIds.length,
        txHash
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Claim confirmation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLAIM_CONFIRM_ERROR',
          message: 'Failed to confirm claim'
        }
      },
      { status: 500 }
    );
  }
}
