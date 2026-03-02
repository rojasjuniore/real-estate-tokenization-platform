import { prisma } from "@/lib/prisma";
import { KYCStatus, UserRole } from "@prisma/client";

export interface CreateUserData {
  walletAddress: string;
  email?: string;
  name?: string;
}

export const userService = {
  async findByWallet(walletAddress: string) {
    return prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        kycSubmission: true,
      },
    });
  },

  async createOrUpdate(data: CreateUserData) {
    const normalizedAddress = data.walletAddress.toLowerCase();

    return prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
      },
      create: {
        walletAddress: normalizedAddress,
        email: data.email,
        name: data.name,
      },
    });
  },

  async getPortfolio(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            tokenId: true,
            name: true,
            images: true,
            pricePerFraction: true,
            estimatedROI: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getPortfolioValue(userId: string) {
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            pricePerFraction: true,
          },
        },
      },
    });

    return portfolio.reduce((total, p) => {
      return total + p.tokenAmount * Number(p.property.pricePerFraction);
    }, 0);
  },

  async updateKYCStatus(userId: string, status: KYCStatus, adminNotes?: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: status },
      }),
      prisma.kYCSubmission.updateMany({
        where: { userId },
        data: {
          status,
          adminNotes,
          reviewedAt: new Date(),
        },
      }),
    ]);
  },

  async setRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  },

  async getAll(page = 1, limit = 20, search?: string) {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { walletAddress: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              portfolio: true,
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
