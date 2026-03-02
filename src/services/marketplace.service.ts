import { prisma } from "@/lib/prisma";
import { ListingStatus } from "@prisma/client";

export interface CreateListingData {
  propertyId: string;
  seller: string;
  amount: number;
  pricePerToken: number;
  paymentToken: string;
}

export interface ListingFilters {
  propertyId?: string;
  seller?: string;
  status?: ListingStatus;
  minPrice?: number;
  maxPrice?: number;
  paymentToken?: string;
}

export const marketplaceService = {
  async getListings(filters: ListingFilters = {}, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters.seller) {
      where.seller = filters.seller.toLowerCase();
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = "ACTIVE";
    }

    if (filters.minPrice || filters.maxPrice) {
      where.pricePerToken = {};
      if (filters.minPrice) {
        (where.pricePerToken as Record<string, number>).gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        (where.pricePerToken as Record<string, number>).lte = filters.maxPrice;
      }
    }

    if (filters.paymentToken) {
      where.paymentToken = filters.paymentToken;
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              images: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });
  },

  async create(data: CreateListingData) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    return prisma.listing.create({
      data: {
        propertyId: data.propertyId,
        seller: data.seller.toLowerCase(),
        amount: data.amount,
        pricePerToken: data.pricePerToken,
        paymentToken: data.paymentToken,
        status: "ACTIVE",
      },
    });
  },

  async cancel(id: string, sellerAddress: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    if (listing.seller.toLowerCase() !== sellerAddress.toLowerCase()) {
      throw new Error("Not authorized to cancel this listing");
    }

    if (listing.status !== "ACTIVE") {
      throw new Error("Listing is not active");
    }

    return prisma.listing.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  },

  async markSold(id: string, buyerAddress: string, amount: number, txHash: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    const remainingAmount = listing.amount - amount;
    const newStatus = remainingAmount === 0 ? "SOLD" : "ACTIVE";

    await prisma.$transaction([
      prisma.listing.update({
        where: { id },
        data: {
          amount: remainingAmount,
          status: newStatus,
        },
      }),
      // Update or create buyer's portfolio
      prisma.portfolio.upsert({
        where: {
          userId_propertyId: {
            userId: buyerAddress, // This should be the user ID, not address
            propertyId: listing.propertyId,
          },
        },
        update: {
          tokenAmount: { increment: amount },
        },
        create: {
          userId: buyerAddress,
          propertyId: listing.propertyId,
          tokenAmount: amount,
        },
      }),
    ]);

    return { success: true, txHash };
  },

  async getByProperty(propertyId: string) {
    return prisma.listing.findMany({
      where: {
        propertyId,
        status: "ACTIVE",
      },
      orderBy: { pricePerToken: "asc" },
    });
  },

  async getBySeller(sellerAddress: string) {
    return prisma.listing.findMany({
      where: {
        seller: sellerAddress.toLowerCase(),
      },
      include: {
        property: {
          select: {
            id: true,
            tokenId: true,
            name: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getStats() {
    const [activeListings, totalVolume, avgPrice] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.aggregate({
        where: { status: "SOLD" },
        _sum: {
          pricePerToken: true,
        },
      }),
      prisma.listing.aggregate({
        where: { status: "ACTIVE" },
        _avg: {
          pricePerToken: true,
        },
      }),
    ]);

    return {
      activeListings,
      totalVolume: totalVolume._sum.pricePerToken || 0,
      averagePrice: avgPrice._avg.pricePerToken || 0,
    };
  },
};
