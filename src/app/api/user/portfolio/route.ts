import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_WALLET',
            message: 'Wallet address is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid wallet address format',
          },
        },
        { status: 400 }
      );
    }

    const normalizedAddress = wallet.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true },
    });

    if (!user) {
      // Return empty portfolio for users not yet in DB
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
            images: true,
            pricePerFraction: true,
            tokenId: true,
          },
        },
      },
    });

    // Transform data to match panel expectations
    const data = portfolio.map((item) => ({
      id: item.id,
      propertyId: item.propertyId,
      property: {
        id: item.property.id,
        name: item.property.name,
        location: item.property.location,
        images: item.property.images,
        pricePerFraction: item.property.pricePerFraction.toString(),
        tokenId: item.property.tokenId,
      },
      tokenAmount: item.tokenAmount,
      averagePurchasePrice: item.property.pricePerFraction.toString(),
      totalInvested: (Number(item.property.pricePerFraction) * item.tokenAmount).toFixed(2),
    }));

    return NextResponse.json({
      success: true,
      data: serializeBigInt(data),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch portfolio',
        },
      },
      { status: 500 }
    );
  }
}
