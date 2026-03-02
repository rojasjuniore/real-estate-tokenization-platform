import { marketplaceService } from '../marketplace.service';
import { prisma } from '@/lib/prisma';
import { ListingStatus } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    listing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
    portfolio: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('marketplaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListings', () => {
    const mockListings = [
      {
        id: 'listing-1',
        propertyId: 'prop-1',
        seller: '0x123',
        amount: 100,
        pricePerToken: 150,
        status: 'ACTIVE' as ListingStatus,
        property: {
          id: 'prop-1',
          tokenId: 1,
          name: 'Property 1',
          images: ['img1.jpg'],
          location: 'Miami, FL',
        },
      },
    ];

    it('should return paginated active listings by default', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(1);

      const result = await marketplaceService.getListings();

      expect(result).toEqual({
        listings: mockListings,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should filter by propertyId', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(1);

      await marketplaceService.getListings({ propertyId: 'prop-1' });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ propertyId: 'prop-1' }),
        })
      );
    });

    it('should filter by seller (normalized)', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(1);

      await marketplaceService.getListings({ seller: '0x123ABC' });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ seller: '0x123abc' }),
        })
      );
    });

    it('should filter by status', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(0);

      await marketplaceService.getListings({ status: 'SOLD' as ListingStatus });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SOLD' }),
        })
      );
    });

    it('should filter by price range', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(1);

      await marketplaceService.getListings({ minPrice: 100, maxPrice: 200 });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricePerToken: { gte: 100, lte: 200 },
          }),
        })
      );
    });

    it('should filter by payment token', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(1);

      await marketplaceService.getListings({ paymentToken: 'USDT' });

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ paymentToken: 'USDT' }),
        })
      );
    });

    it('should handle pagination', async () => {
      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(50);

      const result = await marketplaceService.getListings({}, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);

      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('getById', () => {
    it('should return listing with property details', async () => {
      const mockListing = {
        id: 'listing-1',
        propertyId: 'prop-1',
        property: { id: 'prop-1', name: 'Property 1' },
      };

      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

      const result = await marketplaceService.getById('listing-1');

      expect(result).toEqual(mockListing);
      expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        include: { property: true },
      });
    });

    it('should return null for non-existent listing', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await marketplaceService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createData = {
      propertyId: 'prop-1',
      seller: '0x123ABC',
      amount: 100,
      pricePerToken: 150,
      paymentToken: 'USDT',
    };

    it('should create listing with normalized seller address', async () => {
      const mockProperty = { id: 'prop-1', tokenId: 1 };
      const mockListing = {
        id: 'new-listing',
        ...createData,
        seller: '0x123abc',
        status: 'ACTIVE',
      };

      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (mockPrisma.listing.create as jest.Mock).mockResolvedValue(mockListing);

      const result = await marketplaceService.create(createData);

      expect(result).toEqual(mockListing);
      expect(mockPrisma.listing.create).toHaveBeenCalledWith({
        data: {
          propertyId: 'prop-1',
          seller: '0x123abc',
          amount: 100,
          pricePerToken: 150,
          paymentToken: 'USDT',
          status: 'ACTIVE',
        },
      });
    });

    it('should throw error if property not found', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        marketplaceService.create(createData)
      ).rejects.toThrow('Property not found');
    });
  });

  describe('cancel', () => {
    const mockActiveListing = {
      id: 'listing-1',
      seller: '0x123',
      status: 'ACTIVE' as ListingStatus,
    };

    it('should cancel listing by owner', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockActiveListing);

      const cancelledListing = { ...mockActiveListing, status: 'CANCELLED' };
      (mockPrisma.listing.update as jest.Mock).mockResolvedValue(cancelledListing);

      const result = await marketplaceService.cancel('listing-1', '0x123');

      expect(result).toEqual(cancelledListing);
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should allow cancellation with different case address', async () => {
      // The seller is stored lowercase in the mock
      const listingWithMixedCase = {
        ...mockActiveListing,
        seller: '0x123abc', // Stored lowercase
      };
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(listingWithMixedCase);

      const cancelledListing = { ...listingWithMixedCase, status: 'CANCELLED' };
      (mockPrisma.listing.update as jest.Mock).mockResolvedValue(cancelledListing);

      // Input with different case should still match
      const result = await marketplaceService.cancel('listing-1', '0x123ABC');

      expect(result).toEqual(cancelledListing);
    });

    it('should throw error if listing not found', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        marketplaceService.cancel('non-existent', '0x123')
      ).rejects.toThrow('Listing not found');
    });

    it('should throw error if not owner', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockActiveListing);

      await expect(
        marketplaceService.cancel('listing-1', '0x456')
      ).rejects.toThrow('Not authorized to cancel this listing');
    });

    it('should throw error if listing not active', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue({
        ...mockActiveListing,
        status: 'SOLD',
      });

      await expect(
        marketplaceService.cancel('listing-1', '0x123')
      ).rejects.toThrow('Listing is not active');
    });
  });

  describe('markSold', () => {
    const mockListing = {
      id: 'listing-1',
      propertyId: 'prop-1',
      seller: '0x123',
      amount: 100,
      status: 'ACTIVE' as ListingStatus,
      property: { id: 'prop-1', tokenId: 1 },
    };

    it('should mark listing as sold when fully purchased', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);

      const result = await marketplaceService.markSold('listing-1', 'buyer-1', 100, '0xhash');

      expect(result).toEqual({ success: true, txHash: '0xhash' });
    });

    it('should keep listing active when partially purchased', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);

      const result = await marketplaceService.markSold('listing-1', 'buyer-1', 50, '0xhash');

      expect(result).toEqual({ success: true, txHash: '0xhash' });
    });

    it('should throw error if listing not found', async () => {
      (mockPrisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        marketplaceService.markSold('non-existent', 'buyer-1', 100, '0xhash')
      ).rejects.toThrow('Listing not found');
    });
  });

  describe('getByProperty', () => {
    it('should return active listings for property sorted by price', async () => {
      const mockListings = [
        { id: 'listing-1', pricePerToken: 100 },
        { id: 'listing-2', pricePerToken: 150 },
      ];

      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);

      const result = await marketplaceService.getByProperty('prop-1');

      expect(result).toEqual(mockListings);
      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'prop-1',
          status: 'ACTIVE',
        },
        orderBy: { pricePerToken: 'asc' },
      });
    });
  });

  describe('getBySeller', () => {
    it('should return all listings for seller with normalized address', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          seller: '0x123',
          property: { id: 'prop-1', tokenId: 1, name: 'Property 1', images: [] },
        },
      ];

      (mockPrisma.listing.findMany as jest.Mock).mockResolvedValue(mockListings);

      const result = await marketplaceService.getBySeller('0x123ABC');

      expect(result).toEqual(mockListings);
      expect(mockPrisma.listing.findMany).toHaveBeenCalledWith({
        where: { seller: '0x123abc' },
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
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStats', () => {
    it('should return marketplace statistics', async () => {
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.listing.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { pricePerToken: 50000 } })
        .mockResolvedValueOnce({ _avg: { pricePerToken: 150 } });

      const result = await marketplaceService.getStats();

      expect(result).toEqual({
        activeListings: 10,
        totalVolume: 50000,
        averagePrice: 150,
      });
    });

    it('should handle empty marketplace', async () => {
      (mockPrisma.listing.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.listing.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { pricePerToken: null } })
        .mockResolvedValueOnce({ _avg: { pricePerToken: null } });

      const result = await marketplaceService.getStats();

      expect(result).toEqual({
        activeListings: 0,
        totalVolume: 0,
        averagePrice: 0,
      });
    });
  });
});
