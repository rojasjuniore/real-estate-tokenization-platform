import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get the highest tokenId currently in use
    const maxTokenId = await prisma.property.aggregate({
      _max: {
        tokenId: true,
      },
    });

    // Next tokenId is max + 1, or 1 if no properties exist
    // Convert BigInt to Number for the response
    const maxValue = maxTokenId._max.tokenId ? Number(maxTokenId._max.tokenId) : 0;
    const nextTokenId = maxValue + 1;

    return NextResponse.json({
      success: true,
      data: {
        nextTokenId,
      },
    });
  } catch (error) {
    console.error('Error getting next token ID:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get next token ID',
        },
      },
      { status: 500 }
    );
  }
}
