import { propertyService } from '../property.service';
import { prisma } from '@/lib/prisma';
import { PropertyStatus, PropertyType } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    portfolio: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    dividend: {
      aggregate: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('propertyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    const mockProperties = [
      {
        id: 'prop-1',
        tokenId: 1,
        name: 'Property 1',
        location: 'Miami, FL',
        status: 'ACTIVE' as PropertyStatus,
        propertyType: 'RESIDENTIAL' as PropertyType,
        totalFractions: 1000,
        availableFractions: 500,
        pricePerFraction: 100,
        createdAt: new Date(),
      },
      {
        id: 'prop-2',
        tokenId: 2,
        name: 'Property 2',
        location: 'New York, NY',
        status: 'DRAFT' as PropertyStatus,
        propertyType: 'COMMERCIAL' as PropertyType,
        totalFractions: 2000,
        availableFractions: 2000,
        pricePerFraction: 200,
        createdAt: new Date(),
      },
    ];

    it('should return paginated properties with no filters', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(2);

      const result = await propertyService.getAll();

      expect(result).toEqual({
        properties: mockProperties,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by status', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(1);

      await propertyService.getAll({ status: 'ACTIVE' as PropertyStatus });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should filter by property type', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[1]]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(1);

      await propertyService.getAll({ type: 'COMMERCIAL' as PropertyType });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { propertyType: 'COMMERCIAL' },
        })
      );
    });

    it('should filter by price range', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(2);

      await propertyService.getAll({ minPrice: 50, maxPrice: 150 });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pricePerFraction: { gte: 50, lte: 150 },
          },
        })
      );
    });

    it('should filter by search term', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[0]]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(1);

      await propertyService.getAll({ search: 'Miami' });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'Miami', mode: 'insensitive' } },
              { location: { contains: 'Miami', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([mockProperties[1]]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(25);

      const result = await propertyService.getAll({}, 2, 10);

      expect(result).toEqual({
        properties: [mockProperties[1]],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('getById', () => {
    const mockProperty = {
      id: 'prop-1',
      tokenId: 1,
      name: 'Property 1',
      listings: [],
      dividends: [],
    };

    it('should return property with related data', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);

      const result = await propertyService.getById('prop-1');

      expect(result).toEqual(mockProperty);
      expect(mockPrisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        include: {
          listings: {
            where: { status: 'ACTIVE' },
            orderBy: { pricePerToken: 'asc' },
            take: 10,
          },
          dividends: {
            where: { status: 'DISTRIBUTED' },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    });

    it('should return null for non-existent property', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await propertyService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByTokenId', () => {
    it('should return property by token ID', async () => {
      const mockProperty = { id: 'prop-1', tokenId: 1 };
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);

      const result = await propertyService.getByTokenId(1);

      expect(result).toEqual(mockProperty);
      expect(mockPrisma.property.findUnique).toHaveBeenCalledWith({
        where: { tokenId: 1 },
      });
    });
  });

  describe('create', () => {
    it('should create property with default values', async () => {
      const createData = {
        tokenId: 1,
        name: 'New Property',
        description: 'A new property',
        location: 'Miami, FL',
        propertyType: 'RESIDENTIAL' as PropertyType,
        images: ['image1.jpg'],
        metadataUri: 'ipfs://hash',
        totalFractions: 1000,
        pricePerFraction: 100,
        estimatedROI: 8.5,
      };

      const createdProperty = {
        id: 'new-prop',
        ...createData,
        availableFractions: 1000,
        status: 'DRAFT',
      };

      (mockPrisma.property.create as jest.Mock).mockResolvedValue(createdProperty);

      const result = await propertyService.create(createData);

      expect(result).toEqual(createdProperty);
      expect(mockPrisma.property.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          availableFractions: 1000,
          status: 'DRAFT',
        },
      });
    });
  });

  describe('update', () => {
    it('should update property with partial data', async () => {
      const updatedProperty = {
        id: 'prop-1',
        name: 'Updated Name',
      };

      (mockPrisma.property.update as jest.Mock).mockResolvedValue(updatedProperty);

      const result = await propertyService.update('prop-1', { name: 'Updated Name' });

      expect(result).toEqual(updatedProperty);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update property status', async () => {
      const updatedProperty = {
        id: 'prop-1',
        status: 'ACTIVE',
      };

      (mockPrisma.property.update as jest.Mock).mockResolvedValue(updatedProperty);

      const result = await propertyService.updateStatus('prop-1', 'ACTIVE' as PropertyStatus);

      expect(result).toEqual(updatedProperty);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { status: 'ACTIVE' },
      });
    });
  });

  describe('getHolders', () => {
    it('should return list of property holders', async () => {
      const mockPortfolios = [
        {
          tokenAmount: 500,
          user: {
            id: 'user-1',
            walletAddress: '0x123',
            name: 'John Doe',
          },
        },
        {
          tokenAmount: 300,
          user: {
            id: 'user-2',
            walletAddress: '0x456',
            name: 'Jane Doe',
          },
        },
      ];

      (mockPrisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolios);

      const result = await propertyService.getHolders('prop-1');

      expect(result).toEqual([
        { address: '0x123', name: 'John Doe', amount: 500 },
        { address: '0x456', name: 'Jane Doe', amount: 300 },
      ]);

      expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith({
        where: { propertyId: 'prop-1' },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              name: true,
            },
          },
        },
        orderBy: { tokenAmount: 'desc' },
      });
    });
  });

  describe('getStats', () => {
    it('should return property statistics', async () => {
      const mockProperty = {
        id: 'prop-1',
        tokenId: 1,
        totalFractions: 1000,
        availableFractions: 250,
        _count: {
          listings: 5,
          dividends: 3,
        },
      };

      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (mockPrisma.portfolio.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.dividend.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: 5000 },
      });

      const result = await propertyService.getStats('prop-1');

      expect(result).toEqual({
        tokenId: 1,
        totalFractions: 1000,
        availableFractions: 250,
        soldPercentage: 75,
        holdersCount: 10,
        activeListings: 5,
        totalDistributions: 3,
        totalDividendsPaid: 5000,
      });
    });

    it('should return null for non-existent property', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await propertyService.getStats('non-existent');

      expect(result).toBeNull();
    });

    it('should handle property with no dividends paid', async () => {
      const mockProperty = {
        id: 'prop-1',
        tokenId: 1,
        totalFractions: 1000,
        availableFractions: 1000,
        _count: {
          listings: 0,
          dividends: 0,
        },
      };

      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (mockPrisma.portfolio.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.dividend.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: null },
      });

      const result = await propertyService.getStats('prop-1');

      expect(result).toEqual({
        tokenId: 1,
        totalFractions: 1000,
        availableFractions: 1000,
        soldPercentage: 0,
        holdersCount: 0,
        activeListings: 0,
        totalDistributions: 0,
        totalDividendsPaid: 0,
      });
    });
  });
});
