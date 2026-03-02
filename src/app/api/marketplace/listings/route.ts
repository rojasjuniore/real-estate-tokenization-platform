import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeBigInt } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const seller = searchParams.get('seller');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (seller) {
      where.seller = seller.toLowerCase();
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              images: true,
              tokenId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.listing.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: serializeBigInt(listings),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listings fetch error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LISTINGS_FETCH_ERROR',
          message: 'Failed to fetch listings'
        }
      },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { propertyId, amount, pricePerToken, paymentToken, onChainListingId, txHash, approvalTxHash } = body;

    if (!propertyId || !amount || !pricePerToken || !paymentToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'All fields are required'
          }
        },
        { status: 400 }
      );
    }

    // Verify property exists
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

    const listing = await prisma.listing.create({
      data: {
        propertyId,
        seller: walletAddress.toLowerCase(),
        amount: parseInt(amount),
        pricePerToken: parseFloat(pricePerToken),
        paymentToken,
        status: 'ACTIVE',
        ...(onChainListingId && { onChainListingId: parseInt(onChainListingId) }),
        ...(txHash && { txHash }),
        ...(approvalTxHash && { approvalTxHash }),
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

    return NextResponse.json({
      success: true,
      data: serializeBigInt(listing)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listing creation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LISTING_CREATION_ERROR',
          message: 'Failed to create listing'
        }
      },
      { status: 500 }
    );
  }
}
