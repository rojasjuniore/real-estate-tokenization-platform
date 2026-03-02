import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        kycSubmission: {
          select: {
            id: true,
            status: true,
            adminNotes: true,
            createdAt: true,
            reviewedAt: true
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

    return NextResponse.json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        submission: user.kycSubmission
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('KYC status error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KYC_STATUS_ERROR',
          message: 'Failed to get KYC status'
        }
      },
      { status: 500 }
    );
  }
}
