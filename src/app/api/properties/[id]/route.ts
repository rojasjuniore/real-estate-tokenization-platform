import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Support both CUID (id) and numeric tokenId
    const isNumeric = /^\d+$/.test(id);

    const property = await prisma.property.findFirst({
      where: isNumeric
        ? { tokenId: BigInt(id) }
        : { id },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          orderBy: { pricePerToken: 'asc' },
          take: 5,
        },
        dividends: {
          where: { status: 'DISTRIBUTED' },
          orderBy: { distributedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            listings: true,
            dividends: true,
            portfolios: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(property),
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch property',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Support both CUID (id) and numeric tokenId
    const isNumeric = /^\d+$/.test(id);

    // Check if property exists
    const existing = await prisma.property.findFirst({
      where: isNumeric
        ? { tokenId: BigInt(id) }
        : { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow certain fields to be updated
    const allowedFields = [
      'name',
      'description',
      'location',
      'mapUrl',
      'propertyType',
      'images',
      'documents',
      'estimatedROI',
      'timeline',
      'status',
      'totalFractions',
      'availableFractions',
      'pricePerFraction',
      'tokenId',
      'metadataUri',
      // Blockchain data
      'mintTxHash',
      'approveTxHash',
      'listingTxHash',
      'mintBlockNumber',
      'contractAddress',
      'chainId',
      'mintedAt',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const property = await prisma.property.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(property),
    });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update property',
        },
      },
      { status: 500 }
    );
  }
}
