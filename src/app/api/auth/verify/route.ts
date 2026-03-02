import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, signature } = body;

    if (!address || !message || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Address, message, and signature are required'
          }
        },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed'
          }
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        address
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Verification error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Failed to verify signature'
        }
      },
      { status: 500 }
    );
  }
}
