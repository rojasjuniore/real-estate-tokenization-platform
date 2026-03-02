import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { action } = body; // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Action must be accept or reject'
          }
        },
        { status: 400 }
      );
    }

    // Placeholder - Offer model needs to be added to schema
    // In production, update offer status and handle token transfer for accept

    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

    return NextResponse.json({
      success: true,
      data: {
        id,
        status,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Offer update error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OFFER_UPDATE_ERROR',
          message: 'Failed to update offer'
        }
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Placeholder - Offer model needs to be added to schema
    // Verify offer belongs to wallet before cancelling

    return NextResponse.json({
      success: true,
      data: {
        id,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Offer cancellation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OFFER_CANCEL_ERROR',
          message: 'Failed to cancel offer'
        }
      },
      { status: 500 }
    );
  }
}
