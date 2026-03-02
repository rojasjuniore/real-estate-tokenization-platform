import { userService } from '../user.service';
import { prisma } from '@/lib/prisma';
import { KYCStatus, UserRole } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    portfolio: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    kYCSubmission: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByWallet', () => {
    it('should find user by wallet address (lowercase)', async () => {
      const mockUser = {
        id: 'user-1',
        walletAddress: '0x123abc',
        email: 'user@test.com',
        kycSubmission: null,
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findByWallet('0x123ABC');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: '0x123abc' },
        include: { kycSubmission: true },
      });
    });

    it('should return null for non-existent user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.findByWallet('0xnonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createOrUpdate', () => {
    it('should create new user with normalized wallet address', async () => {
      const userData = {
        walletAddress: '0xABC123',
        email: 'new@test.com',
        name: 'New User',
      };

      const createdUser = {
        id: 'new-user',
        walletAddress: '0xabc123',
        email: 'new@test.com',
        name: 'New User',
      };

      (mockPrisma.user.upsert as jest.Mock).mockResolvedValue(createdUser);

      const result = await userService.createOrUpdate(userData);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { walletAddress: '0xabc123' },
        update: {
          email: 'new@test.com',
          name: 'New User',
        },
        create: {
          walletAddress: '0xabc123',
          email: 'new@test.com',
          name: 'New User',
        },
      });
    });

    it('should update existing user with partial data', async () => {
      const userData = {
        walletAddress: '0xABC123',
        name: 'Updated Name',
      };

      const updatedUser = {
        id: 'existing-user',
        walletAddress: '0xabc123',
        name: 'Updated Name',
      };

      (mockPrisma.user.upsert as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.createOrUpdate(userData);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
        where: { walletAddress: '0xabc123' },
        update: {
          name: 'Updated Name',
        },
        create: {
          walletAddress: '0xabc123',
          email: undefined,
          name: 'Updated Name',
        },
      });
    });
  });

  describe('getPortfolio', () => {
    it('should return user portfolio with property details', async () => {
      const mockPortfolio = [
        {
          id: 'portfolio-1',
          userId: 'user-1',
          propertyId: 'prop-1',
          tokenAmount: 100,
          property: {
            id: 'prop-1',
            tokenId: 1,
            name: 'Property 1',
            images: ['image1.jpg'],
            pricePerFraction: 100,
            estimatedROI: 8.5,
            status: 'ACTIVE',
          },
        },
      ];

      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolio);

      const result = await userService.getPortfolio('user-1');

      expect(result).toEqual(mockPortfolio);
      expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return empty array for user with no portfolio', async () => {
      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userService.getPortfolio('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getPortfolioValue', () => {
    it('should calculate total portfolio value', async () => {
      const mockPortfolio = [
        {
          tokenAmount: 100,
          property: { pricePerFraction: 150 },
        },
        {
          tokenAmount: 50,
          property: { pricePerFraction: 200 },
        },
      ];

      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolio);

      const result = await userService.getPortfolioValue('user-1');

      // 100 * 150 + 50 * 200 = 15000 + 10000 = 25000
      expect(result).toBe(25000);
    });

    it('should return 0 for empty portfolio', async () => {
      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue([]);

      const result = await userService.getPortfolioValue('user-1');

      expect(result).toBe(0);
    });
  });

  describe('updateKYCStatus', () => {
    it('should update user KYC status with transaction', async () => {
      const mockTransactionResult = [
        { id: 'user-1', kycStatus: 'APPROVED' },
        { count: 1 },
      ];

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(mockTransactionResult);

      const result = await userService.updateKYCStatus(
        'user-1',
        'APPROVED' as KYCStatus,
        'Documents verified'
      );

      expect(result).toEqual(mockTransactionResult);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('setRole', () => {
    it('should update user role', async () => {
      const updatedUser = {
        id: 'user-1',
        role: 'ADMIN',
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.setRole('user-1', 'ADMIN' as UserRole);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'ADMIN' },
      });
    });
  });

  describe('getAll', () => {
    const mockUsers = [
      {
        id: 'user-1',
        walletAddress: '0x123',
        email: 'user1@test.com',
        name: 'User 1',
        _count: { portfolio: 2, transactions: 5 },
      },
      {
        id: 'user-2',
        walletAddress: '0x456',
        email: 'user2@test.com',
        name: 'User 2',
        _count: { portfolio: 1, transactions: 3 },
      },
    ];

    it('should return paginated users', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAll();

      expect(result).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by search term', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[0]]);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(1);

      await userService.getAll(1, 20, 'user1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { walletAddress: { contains: 'user1', mode: 'insensitive' } },
              { email: { contains: 'user1', mode: 'insensitive' } },
              { name: { contains: 'user1', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should handle pagination', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([mockUsers[1]]);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(25);

      const result = await userService.getAll(3, 10);

      expect(result).toEqual({
        users: [mockUsers[1]],
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('getTransactions', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        userId: 'user-1',
        type: 'BUY',
        amount: 1000,
        createdAt: new Date(),
      },
      {
        id: 'tx-2',
        userId: 'user-1',
        type: 'SELL',
        amount: 500,
        createdAt: new Date(),
      },
    ];

    it('should return paginated transactions for user', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(2);

      const result = await userService.getTransactions('user-1');

      expect(result).toEqual({
        transactions: mockTransactions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination for transactions', async () => {
      (mockPrisma.transaction.findMany as jest.Mock).mockResolvedValue([mockTransactions[1]]);
      (mockPrisma.transaction.count as jest.Mock).mockResolvedValue(50);

      const result = await userService.getTransactions('user-1', 2, 10);

      expect(result).toEqual({
        transactions: [mockTransactions[1]],
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
    });
  });
});
