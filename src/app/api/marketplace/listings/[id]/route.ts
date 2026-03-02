import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeBigInt } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            description: true,
            images: true,
            tokenId: true,
            location: true,
            estimatedROI: true
          }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: serializeBigInt(listing)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listing fetch error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LISTING_FETCH_ERROR',
          message: 'Failed to fetch listing'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const walletAddress = request.headers.get('x-wallet-address');
    const body = await request.json();

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

    const listing = await prisma.listing.findUnique({
      where: { id }
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

    // Only seller can cancel, but buyer can mark as SOLD
    const { status, buyerAddress, buyTxHash } = body;

    if (status === 'SOLD') {
      // Update listing to SOLD and record buyer
      const updated = await prisma.listing.update({
        where: { id },
        data: {
          status: 'SOLD',
          buyer: buyerAddress?.toLowerCase() || walletAddress.toLowerCase(),
          buyTxHash: buyTxHash || null
        }
      });

      // Transfer tokens in portfolio (from seller to buyer)
      await prisma.$transaction(async (tx) => {
        // Decrease seller's token amount
        const sellerPortfolio = await tx.portfolio.findFirst({
          where: {
            propertyId: listing.propertyId,
            user: { walletAddress: listing.seller }
          }
        });

        if (sellerPortfolio) {
          const newAmount = sellerPortfolio.tokenAmount - listing.amount;
          if (newAmount <= 0) {
            await tx.portfolio.delete({ where: { id: sellerPortfolio.id } });
          } else {
            await tx.portfolio.update({
              where: { id: sellerPortfolio.id },
              data: { tokenAmount: newAmount }
            });
          }
        }

        // Find or create buyer user
        const buyerAddr = (buyerAddress || walletAddress).toLowerCase();
        let buyerUser = await tx.user.findUnique({
          where: { walletAddress: buyerAddr }
        });

        if (!buyerUser) {
          buyerUser = await tx.user.create({
            data: { walletAddress: buyerAddr }
          });
        }

        // Find or create buyer portfolio
        const buyerPortfolio = await tx.portfolio.findFirst({
          where: {
            propertyId: listing.propertyId,
            userId: buyerUser.id
          }
        });

        if (buyerPortfolio) {
          await tx.portfolio.update({
            where: { id: buyerPortfolio.id },
            data: { tokenAmount: buyerPortfolio.tokenAmount + listing.amount }
          });
        } else {
          await tx.portfolio.create({
            data: {
              propertyId: listing.propertyId,
              userId: buyerUser.id,
              tokenAmount: listing.amount
            }
          });
        }

        // Record the transaction
        await tx.transaction.create({
          data: {
            propertyId: listing.propertyId,
            userId: buyerUser.id,
            type: 'BUY',
            amount: Number(listing.pricePerToken) * listing.amount,
            tokenAmount: listing.amount,
            txHash: buyTxHash || `marketplace-${id}`,
            paymentToken: listing.paymentToken,
            status: 'CONFIRMED'
          }
        });
      });

      return NextResponse.json({
        success: true,
        data: serializeBigInt(updated)
      });
    }

    // For other status updates, only seller can modify
    if (listing.seller.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to update this listing'
          }
        },
        { status: 403 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(updated)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listing update error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LISTING_UPDATE_ERROR',
          message: 'Failed to update listing'
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

    const listing = await prisma.listing.findUnique({
      where: { id }
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

    if (listing.seller.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to cancel this listing'
          }
        },
        { status: 403 }
      );
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Listing cancelled successfully'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listing cancellation error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LISTING_CANCEL_ERROR',
          message: 'Failed to cancel listing'
        }
      },
      { status: 500 }
    );
  }
}
