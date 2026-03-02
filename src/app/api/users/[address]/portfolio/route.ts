import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

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
      select: { id: true },
    });

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

    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: {
            dividends: {
              where: { status: 'DISTRIBUTED' },
              orderBy: { distributedAt: 'desc' },
              take: 1,
            },
            _count: {
              select: { listings: true },
            },
          },
        },
      },
    });

    // Calculate totals
    const totals = portfolio.reduce(
      (acc, item) => {
        const value =
          Number(item.tokenAmount) * Number(item.property.pricePerFraction);
        return {
          totalTokens: acc.totalTokens + item.tokenAmount,
          totalValue: acc.totalValue + value,
          properties: acc.properties + 1,
        };
      },
      { totalTokens: 0, totalValue: 0, properties: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        totals,
      },
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
