import { NextRequest, NextResponse } from 'next/server';
import prisma, { serializeBigInt } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
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

    const normalizedAddress = address.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        portfolio: {
          include: {
            property: {
              select: {
                id: true,
                tokenId: true,
                name: true,
                location: true,
                pricePerFraction: true,
                totalFractions: true,
                status: true,
                images: true,
              },
            },
          },
        },
        transactions: {
          where: { type: 'BUY' },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            portfolio: true,
            transactions: true,
          },
        },
      },
    });

    // Return 404 if user not found
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate purchase totals per property from transactions
    const purchaseByProperty: Record<string, { totalAmount: number; firstPurchase: Date }> = {};
    for (const tx of user.transactions) {
      const propId = tx.propertyId;
      if (!propId) continue; // Skip if no propertyId
      if (!purchaseByProperty[propId]) {
        purchaseByProperty[propId] = { totalAmount: 0, firstPurchase: tx.createdAt };
      }
      purchaseByProperty[propId].totalAmount += Number(tx.amount);
      if (tx.createdAt < purchaseByProperty[propId].firstPurchase) {
        purchaseByProperty[propId].firstPurchase = tx.createdAt;
      }
    }

    // Enrich portfolio with purchase data
    const enrichedPortfolio = user.portfolio.map(p => ({
      ...p,
      purchasePrice: purchaseByProperty[p.propertyId]?.totalAmount || (p.tokenAmount * Number(p.property.pricePerFraction)),
      purchasedAt: purchaseByProperty[p.propertyId]?.firstPurchase || p.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        ...user,
        portfolio: enrichedPortfolio,
      }),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch user',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;
    const body = await request.json();

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
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

    const normalizedAddress = address.toLowerCase();

    // Create or update user
    const user = await prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        ...(body.email && { email: body.email }),
        ...(body.name && { name: body.name }),
      },
      create: {
        walletAddress: normalizedAddress,
        email: body.email,
        name: body.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(user),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user',
        },
      },
      { status: 500 }
    );
  }
}
