import { prisma } from "@/lib/prisma";

export interface CreateDistributionData {
  propertyId: string;
  totalAmount: number;
  paymentToken: string;
  period: string;
}

export const dividendService = {
  async createDistribution(data: CreateDistributionData) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // Get all holders
    const portfolios = await prisma.portfolio.findMany({
      where: { propertyId: data.propertyId },
      include: {
        user: true,
      },
    });

    if (portfolios.length === 0) {
      throw new Error("No holders found for this property");
    }

    // Calculate total tokens held
    const totalTokensHeld = portfolios.reduce((sum, p) => sum + p.tokenAmount, 0);

    // Calculate amount per token
    const amountPerToken = data.totalAmount / totalTokensHeld;

    // Create distribution and claims in transaction
    const result = await prisma.$transaction(async (tx) => {
      const dividend = await tx.dividend.create({
        data: {
          propertyId: data.propertyId,
          totalAmount: data.totalAmount,
          amountPerToken,
          paymentToken: data.paymentToken,
          period: data.period,
          status: "PENDING",
        },
      });

      // Create claims for each holder
      const claims = await Promise.all(
        portfolios.map((portfolio) =>
          tx.dividendClaim.create({
            data: {
              dividendId: dividend.id,
              userAddress: portfolio.user.walletAddress,
              amount: portfolio.tokenAmount * amountPerToken,
              claimed: false,
            },
          })
        )
      );

      return { dividend, claims };
    });

    return result;
  },

  async markDistributed(dividendId: string, txHash?: string) {
    return prisma.dividend.update({
      where: { id: dividendId },
      data: {
        status: "DISTRIBUTED",
        txHash,
        distributedAt: new Date(),
      },
    });
  },

  async getByProperty(propertyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [dividends, total] = await Promise.all([
      prisma.dividend.findMany({
        where: { propertyId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.dividend.count({ where: { propertyId } }),
    ]);

    return {
      dividends,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPendingForUser(walletAddress: string) {
    const normalizedAddress = walletAddress.toLowerCase();

    return prisma.dividendClaim.findMany({
      where: {
        userAddress: normalizedAddress,
        claimed: false,
        dividend: {
          status: "DISTRIBUTED",
        },
      },
      include: {
        dividend: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                tokenId: true,
              },
            },
          },
        },
      },
      orderBy: {
        dividend: {
          createdAt: "desc",
        },
      },
    });
  },

  async markClaimed(claimId: string, txHash: string) {
    return prisma.dividendClaim.update({
      where: { id: claimId },
      data: {
        claimed: true,
        txHash,
        claimedAt: new Date(),
      },
    });
  },

  async getClaimHistory(walletAddress: string, page = 1, limit = 20) {
    const normalizedAddress = walletAddress.toLowerCase();
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      prisma.dividendClaim.findMany({
        where: {
          userAddress: normalizedAddress,
          claimed: true,
        },
        include: {
          dividend: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  tokenId: true,
                },
              },
            },
          },
        },
        orderBy: { claimedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.dividendClaim.count({
        where: {
          userAddress: normalizedAddress,
          claimed: true,
        },
      }),
    ]);

    return {
      claims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getTotalClaimedByUser(walletAddress: string) {
    const result = await prisma.dividendClaim.aggregate({
      where: {
        userAddress: walletAddress.toLowerCase(),
        claimed: true,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  },
};
