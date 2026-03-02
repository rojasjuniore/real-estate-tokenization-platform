import { dividendService } from '../dividend.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    portfolio: {
      findMany: jest.fn(),
    },
    dividend: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dividendClaim: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('dividendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDistribution', () => {
    const mockProperty = {
      id: 'prop-1',
      tokenId: 1,
      name: 'Property 1',
      totalFractions: 1000,
    };

    const mockPortfolios = [
      {
        id: 'portfolio-1',
        propertyId: 'prop-1',
        userId: 'user-1',
        tokenAmount: 600,
        user: { walletAddress: '0x123' },
      },
      {
        id: 'portfolio-2',
        propertyId: 'prop-1',
        userId: 'user-2',
        tokenAmount: 400,
        user: { walletAddress: '0x456' },
      },
    ];

    it('should create distribution and claims for all holders', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolios);

      const mockDividend = {
        id: 'div-1',
        propertyId: 'prop-1',
        totalAmount: 10000,
        amountPerToken: 10,
        status: 'PENDING',
      };

      const mockClaims = [
        { id: 'claim-1', dividendId: 'div-1', userAddress: '0x123', amount: 6000 },
        { id: 'claim-2', dividendId: 'div-1', userAddress: '0x456', amount: 4000 },
      ];

      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          dividend: {
            create: jest.fn().mockResolvedValue(mockDividend),
          },
          dividendClaim: {
            create: jest.fn()
              .mockResolvedValueOnce(mockClaims[0])
              .mockResolvedValueOnce(mockClaims[1]),
          },
        };
        return callback(tx);
      });

      const result = await dividendService.createDistribution({
        propertyId: 'prop-1',
        totalAmount: 10000,
        paymentToken: 'USDT',
        period: 'Q4 2024',
      });

      expect(result.dividend).toEqual(mockDividend);
      expect(result.claims).toHaveLength(2);
    });

    it('should throw error if property not found', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        dividendService.createDistribution({
          propertyId: 'non-existent',
          totalAmount: 10000,
          paymentToken: 'USDT',
          period: 'Q4 2024',
        })
      ).rejects.toThrow('Property not found');
    });

    it('should throw error if no holders found', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        dividendService.createDistribution({
          propertyId: 'prop-1',
          totalAmount: 10000,
          paymentToken: 'USDT',
          period: 'Q4 2024',
        })
      ).rejects.toThrow('No holders found for this property');
    });
  });

  describe('markDistributed', () => {
    it('should update dividend status to DISTRIBUTED', async () => {
      const updatedDividend = {
        id: 'div-1',
        status: 'DISTRIBUTED',
        txHash: '0xabc123',
        distributedAt: expect.any(Date),
      };

      (mockPrisma.dividend.update as jest.Mock).mockResolvedValue(updatedDividend);

      const result = await dividendService.markDistributed('div-1', '0xabc123');

      expect(result).toEqual(updatedDividend);
      expect(mockPrisma.dividend.update).toHaveBeenCalledWith({
        where: { id: 'div-1' },
        data: {
          status: 'DISTRIBUTED',
          txHash: '0xabc123',
          distributedAt: expect.any(Date),
        },
      });
    });

    it('should work without txHash', async () => {
      const updatedDividend = {
        id: 'div-1',
        status: 'DISTRIBUTED',
        distributedAt: expect.any(Date),
      };

      (mockPrisma.dividend.update as jest.Mock).mockResolvedValue(updatedDividend);

      await dividendService.markDistributed('div-1');

      expect(mockPrisma.dividend.update).toHaveBeenCalledWith({
        where: { id: 'div-1' },
        data: {
          status: 'DISTRIBUTED',
          txHash: undefined,
          distributedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getByProperty', () => {
    const mockDividends = [
      { id: 'div-1', propertyId: 'prop-1', totalAmount: 10000, status: 'DISTRIBUTED' },
      { id: 'div-2', propertyId: 'prop-1', totalAmount: 5000, status: 'PENDING' },
    ];

    it('should return paginated dividends for property', async () => {
      (mockPrisma.dividend.findMany as jest.Mock).mockResolvedValue(mockDividends);
      (mockPrisma.dividend.count as jest.Mock).mockResolvedValue(2);

      const result = await dividendService.getByProperty('prop-1');

      expect(result).toEqual({
        dividends: mockDividends,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should handle pagination', async () => {
      (mockPrisma.dividend.findMany as jest.Mock).mockResolvedValue([mockDividends[1]]);
      (mockPrisma.dividend.count as jest.Mock).mockResolvedValue(25);

      const result = await dividendService.getByProperty('prop-1', 2, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);

      expect(mockPrisma.dividend.findMany).toHaveBeenCalledWith({
        where: { propertyId: 'prop-1' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getPendingForUser', () => {
    it('should return pending claims for user (normalized address)', async () => {
      const mockClaims = [
        {
          id: 'claim-1',
          userAddress: '0x123',
          amount: 100,
          claimed: false,
          dividend: {
            id: 'div-1',
            status: 'DISTRIBUTED',
            property: { id: 'prop-1', name: 'Property 1', tokenId: 1 },
          },
        },
      ];

      (mockPrisma.dividendClaim.findMany as jest.Mock).mockResolvedValue(mockClaims);

      const result = await dividendService.getPendingForUser('0x123ABC');

      expect(result).toEqual(mockClaims);
      expect(mockPrisma.dividendClaim.findMany).toHaveBeenCalledWith({
        where: {
          userAddress: '0x123abc',
          claimed: false,
          dividend: {
            status: 'DISTRIBUTED',
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
            createdAt: 'desc',
          },
        },
      });
    });
  });

  describe('markClaimed', () => {
    it('should update claim as claimed with txHash', async () => {
      const updatedClaim = {
        id: 'claim-1',
        claimed: true,
        txHash: '0xdef456',
        claimedAt: expect.any(Date),
      };

      (mockPrisma.dividendClaim.update as jest.Mock).mockResolvedValue(updatedClaim);

      const result = await dividendService.markClaimed('claim-1', '0xdef456');

      expect(result).toEqual(updatedClaim);
      expect(mockPrisma.dividendClaim.update).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        data: {
          claimed: true,
          txHash: '0xdef456',
          claimedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getClaimHistory', () => {
    const mockClaims = [
      {
        id: 'claim-1',
        userAddress: '0x123',
        amount: 100,
        claimed: true,
        claimedAt: new Date(),
        dividend: {
          property: { id: 'prop-1', name: 'Property 1', tokenId: 1 },
        },
      },
    ];

    it('should return paginated claim history', async () => {
      (mockPrisma.dividendClaim.findMany as jest.Mock).mockResolvedValue(mockClaims);
      (mockPrisma.dividendClaim.count as jest.Mock).mockResolvedValue(1);

      const result = await dividendService.getClaimHistory('0x123ABC');

      expect(result).toEqual({
        claims: mockClaims,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrisma.dividendClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userAddress: '0x123abc',
            claimed: true,
          },
        })
      );
    });

    it('should handle pagination', async () => {
      (mockPrisma.dividendClaim.findMany as jest.Mock).mockResolvedValue(mockClaims);
      (mockPrisma.dividendClaim.count as jest.Mock).mockResolvedValue(50);

      const result = await dividendService.getClaimHistory('0x123', 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);

      expect(mockPrisma.dividendClaim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('getTotalClaimedByUser', () => {
    it('should return total amount claimed by user', async () => {
      (mockPrisma.dividendClaim.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 5000 },
      });

      const result = await dividendService.getTotalClaimedByUser('0x123ABC');

      expect(result).toBe(5000);
      expect(mockPrisma.dividendClaim.aggregate).toHaveBeenCalledWith({
        where: {
          userAddress: '0x123abc',
          claimed: true,
        },
        _sum: {
          amount: true,
        },
      });
    });

    it('should return 0 if no claims', async () => {
      (mockPrisma.dividendClaim.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await dividendService.getTotalClaimedByUser('0x123');

      expect(result).toBe(0);
    });
  });
});
