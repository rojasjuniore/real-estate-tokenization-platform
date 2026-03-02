import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Note: The Offer model is not in schema yet - this is a placeholder for future implementation
// For now, we'll return a mock response

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
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
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Offers fetch error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OFFERS_FETCH_ERROR',
          message: 'Failed to fetch offers'
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
    const { listingId, amount, pricePerToken, paymentToken, expiresAt } = body;

    if (!listingId || !amount || !pricePerToken || !paymentToken) {
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

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found'
          }
        },
        { status: 404 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LISTING_NOT_ACTIVE',
            message: 'Listing is not active'
          }
        },
        { status: 400 }
      );
    }

    // Placeholder - return mock offer
    // In production, create in database when Offer model is added
    const mockOffer = {
      id: `offer_${Date.now()}`,
      listingId,
      buyer: walletAddress.toLowerCase(),
      amount: parseInt(amount),
      pricePerToken: parseFloat(pricePerToken),
      paymentToken,
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockOffer
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Offer creation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OFFER_CREATION_ERROR',
          message: 'Failed to create offer'
        }
      },
      { status: 500 }
    );
  }
}
