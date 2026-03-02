import { prisma } from "@/lib/prisma";
import { PropertyStatus, PropertyType } from "@prisma/client";

export interface PropertyFilters {
  status?: PropertyStatus;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface CreatePropertyData {
  tokenId: number;
  name: string;
  description: string;
  location: string;
  propertyType: PropertyType;
  images: string[];
  metadataUri: string;
  totalFractions: number;
  pricePerFraction: number;
  estimatedROI: number;
}

export const propertyService = {
  async getAll(filters: PropertyFilters = {}, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.propertyType = filters.type;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.pricePerFraction = {};
      if (filters.minPrice) {
        (where.pricePerFraction as Record<string, number>).gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        (where.pricePerFraction as Record<string, number>).lte = filters.maxPrice;
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        listings: {
          where: { status: "ACTIVE" },
          orderBy: { pricePerToken: "asc" },
          take: 10,
        },
        dividends: {
          where: { status: "DISTRIBUTED" },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  },

  async getByTokenId(tokenId: number) {
    return prisma.property.findUnique({
      where: { tokenId },
    });
  },

  async create(data: CreatePropertyData) {
    return prisma.property.create({
      data: {
        ...data,
        availableFractions: data.totalFractions,
        status: "DRAFT",
      },
    });
  },

  async update(id: string, data: Partial<CreatePropertyData>) {
    return prisma.property.update({
      where: { id },
      data,
    });
  },

  async updateStatus(id: string, status: PropertyStatus) {
    return prisma.property.update({
      where: { id },
      data: { status },
    });
  },

  async getHolders(propertyId: string) {
    const portfolios = await prisma.portfolio.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
          },
        },
      },
      orderBy: { tokenAmount: "desc" },
    });

    return portfolios.map((p) => ({
      address: p.user.walletAddress,
      name: p.user.name,
      amount: p.tokenAmount,
    }));
  },

  async getStats(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        _count: {
          select: {
            listings: true,
            dividends: true,
          },
        },
      },
    });

    if (!property) return null;

    const holdersCount = await prisma.portfolio.count({
      where: { propertyId },
    });

    const totalDividends = await prisma.dividend.aggregate({
      where: { propertyId, status: "DISTRIBUTED" },
      _sum: { totalAmount: true },
    });

    return {
      tokenId: property.tokenId,
      totalFractions: property.totalFractions,
      availableFractions: property.availableFractions,
      soldPercentage:
        ((property.totalFractions - property.availableFractions) / property.totalFractions) * 100,
      holdersCount,
      activeListings: property._count.listings,
      totalDistributions: property._count.dividends,
      totalDividendsPaid: totalDividends._sum.totalAmount || 0,
    };
  },
};
