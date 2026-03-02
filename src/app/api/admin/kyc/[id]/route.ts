import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';
import { approveKYCOnChain, revokeKYCOnChain } from '@/lib/contracts/kyc-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be APPROVED or REJECTED'
          }
        },
        { status: 400 }
      );
    }

    // First get the user's wallet address
    const existingSubmission = await prisma.kYCSubmission.findUnique({
      where: { id },
      include: { user: { select: { walletAddress: true } } }
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { success: false, error: { code: 'KYC_NOT_FOUND', message: 'KYC submission not found' } },
        { status: 404 }
      );
    }

    const userWallet = existingSubmission.user.walletAddress;

    // Call smart contract to approve/revoke KYC on-chain
    let onChainResult;
    if (status === 'APPROVED') {
      onChainResult = await approveKYCOnChain(userWallet);
    } else {
      onChainResult = await revokeKYCOnChain(userWallet);
    }

    if (!onChainResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLOCKCHAIN_ERROR',
            message: `Failed to ${status === 'APPROVED' ? 'approve' : 'revoke'} KYC on-chain: ${onChainResult.error}`
          }
        },
        { status: 500 }
      );
    }

    // Update database after successful on-chain transaction (including tx hashes)
    const kycSubmission = await prisma.kYCSubmission.update({
      where: { id },
      data: {
        status,
        adminNotes,
        reviewedBy: walletAddress,
        reviewedAt: new Date(),
        marketplaceTxHash: onChainResult.marketplaceTxHash,
        paymentProcessorTxHash: onChainResult.paymentProcessorTxHash,
        user: {
          update: {
            kycStatus: status
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            name: true,
            kycStatus: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: kycSubmission
    });
  } catch (error) {
    console.error('KYC update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KYC_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const kycSubmission = await prisma.kYCSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            name: true,
            kycStatus: true
          }
        }
      }
    });

    if (!kycSubmission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KYC_NOT_FOUND',
            message: 'KYC submission not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: kycSubmission
    });
  } catch (error) {
    console.error('KYC get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KYC_GET_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
