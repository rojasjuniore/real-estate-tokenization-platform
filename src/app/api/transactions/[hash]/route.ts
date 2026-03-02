import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
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
      where: { walletAddress: normalizedAddress }
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

    const transaction = await prisma.transaction.findUnique({
      where: { txHash: hash }
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found'
          }
        },
        { status: 404 }
      );
    }

    // Verify transaction belongs to user
    if (transaction.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to view this transaction'
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transaction fetch error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRANSACTION_FETCH_ERROR',
          message: 'Failed to fetch transaction'
        }
      },
      { status: 500 }
    );
  }
}
