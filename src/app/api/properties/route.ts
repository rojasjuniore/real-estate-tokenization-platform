import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';
import { PropertyStatus, PropertyType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as PropertyStatus | null;
    const type = searchParams.get('type') as PropertyType | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where = {
      ...(status && { status }),
      ...(type && { propertyType: type }),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { listings: true, dividends: true },
          },
          listings: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              onChainListingId: true,
              pricePerToken: true,
              paymentToken: true,
              paymentTokenAddress: true,
              amount: true,
              remainingAmount: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        properties: serializeBigInt(properties),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch properties',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields (tokenId is now optional - assigned after blockchain mint)
    const requiredFields = [
      'name',
      'description',
      'location',
      'propertyType',
      'totalFractions',
      'pricePerFraction',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === '') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Missing required field: ${field}`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate images
    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one image is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if tokenId already exists (only if provided)
    if (body.tokenId) {
      const existing = await prisma.property.findUnique({
        where: { tokenId: body.tokenId },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_TOKEN_ID',
              message: 'A property with this tokenId already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    const property = await prisma.property.create({
      data: {
        tokenId: body.tokenId || null, // Optional - assigned after mint
        name: body.name,
        description: body.description,
        location: body.location,
        mapUrl: body.mapUrl || null,
        propertyType: body.propertyType,
        images: body.images || [],
        documents: body.documents || [],
        metadataUri: body.metadataUri || null, // Generated later
        totalFractions: body.totalFractions,
        availableFractions: body.totalFractions,
        pricePerFraction: body.pricePerFraction,
        estimatedROI: body.estimatedROI || 0,
        timeline: body.timeline || 'SHORT_TERM',
        status: body.status || 'DRAFT',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: serializeBigInt(property),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create property',
        },
      },
      { status: 500 }
    );
  }
}
