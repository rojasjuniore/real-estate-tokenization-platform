import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';

/**
 * GET /api/properties/[id]/listing
 * Get the active marketplace listing for a property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find active listing for this property
    const listing = await prisma.listing.findFirst({
      where: {
        propertyId: id,
        status: 'ACTIVE',
        remainingAmount: { gt: 0 }
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true,
            pricePerFraction: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!listing) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active listing found for this property'
      });
    }

    // Serialize BigInt and Decimal values
    const serializedListing = serializeBigInt({
      id: listing.id,
      onChainListingId: listing.onChainListingId,
      propertyId: listing.propertyId,
      seller: listing.seller,
      amount: listing.amount,
      remainingAmount: listing.remainingAmount,
      pricePerToken: listing.pricePerToken,
      paymentToken: listing.paymentToken,
      paymentTokenAddress: listing.paymentTokenAddress,
      status: listing.status,
      property: listing.property
    });

    return NextResponse.json({
      success: true,
      data: serializedListing
    });
  } catch (error) {
    console.error('Get property listing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_LISTING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
