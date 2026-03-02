import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' }
        },
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get seller info for each listing
    const listingsWithSellers = await Promise.all(
      listings.map(async (listing) => {
        const seller = await prisma.user.findFirst({
          where: { walletAddress: listing.seller },
          select: {
            id: true,
            walletAddress: true,
            name: true,
          },
        });

        return {
          id: listing.id,
          property: listing.property,
          seller: seller || {
            id: 'unknown',
            walletAddress: listing.seller,
            name: 'Unknown',
          },
          fractionCount: listing.amount,
          pricePerFraction: Number(listing.pricePerToken),
          status: listing.status,
          createdAt: listing.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: serializeBigInt(listingsWithSellers),
    });
  } catch (error) {
    console.error('Marketplace listings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARKETPLACE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
