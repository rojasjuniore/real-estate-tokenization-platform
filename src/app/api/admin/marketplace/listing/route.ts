import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';

// Payment token addresses on Polygon
const PAYMENT_TOKEN_ADDRESSES: Record<string, string> = {
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  USDC: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
};

/**
 * POST /api/admin/marketplace/listing
 * Create a new listing in the database after the admin has created it on-chain
 */
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, amount, pricePerToken, paymentToken, txHash, onChainListingId } = body;

    if (!propertyId || !amount || !pricePerToken || !paymentToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: propertyId, amount, pricePerToken, paymentToken'
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
        { success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    // Get payment token address
    const paymentTokenAddress = PAYMENT_TOKEN_ADDRESSES[paymentToken.toUpperCase()];
    if (!paymentTokenAddress) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PAYMENT_TOKEN', message: 'Invalid payment token' } },
        { status: 400 }
      );
    }

    // Create listing record
    const listing = await prisma.listing.create({
      data: {
        propertyId,
        onChainListingId: onChainListingId ? Number(onChainListingId) : null,
        seller: walletAddress,
        amount: Number(amount),
        remainingAmount: Number(amount),
        pricePerToken: Number(pricePerToken),
        paymentToken: paymentToken.toUpperCase(),
        paymentTokenAddress,
        txHash: txHash || null,
        status: 'ACTIVE'
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
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_LISTING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/marketplace/listing
 * Get all listings (admin view)
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const listings = await prisma.listing.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(listings)
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_LISTINGS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
