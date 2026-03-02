/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../properties/route';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock serializeBigInt
jest.mock('@/lib/prisma', () => ({
  serializeBigInt: jest.fn((data) => data),
}));

import prisma from '@/lib/db/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/properties', () => {
    const mockProperties = [
      {
        id: 'prop-1',
        tokenId: 1,
        name: 'Property 1',
        location: 'Miami, FL',
        status: 'ACTIVE',
        propertyType: 'RESIDENTIAL',
        totalFractions: 1000,
        availableFractions: 500,
        pricePerFraction: 100,
        createdAt: new Date(),
        _count: { listings: 5, dividends: 2 },
        listings: [],
      },
    ];

    it('should return paginated properties', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue(mockProperties);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/properties');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.properties).toHaveLength(1);
      expect(data.data.properties[0].id).toBe('prop-1');
      expect(data.data.properties[0].name).toBe('Property 1');
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/properties?status=ACTIVE'
      );

      await GET(request);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should filter by type', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/properties?type=COMMERCIAL'
      );

      await GET(request);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { propertyType: 'COMMERCIAL' },
        })
      );
    });

    it('should handle pagination parameters', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.property.count as jest.Mock).mockResolvedValue(50);

      const request = new NextRequest(
        'http://localhost:3000/api/properties?page=3&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.pagination).toEqual({
        page: 3,
        limit: 20,
        total: 50,
        totalPages: 3,
      });

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        })
      );
    });

    it('should handle database errors', async () => {
      (mockPrisma.property.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/properties');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/properties', () => {
    const validPropertyData = {
      name: 'New Property',
      description: 'A beautiful property',
      location: 'Miami, FL',
      propertyType: 'RESIDENTIAL',
      totalFractions: 1000,
      pricePerFraction: 100,
      images: ['https://example.com/image1.jpg'],
    };

    it('should create property with valid data', async () => {
      const createdProperty = {
        id: 'new-prop',
        ...validPropertyData,
        availableFractions: 1000,
        status: 'DRAFT',
      };

      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.property.create as jest.Mock).mockResolvedValue(createdProperty);

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(validPropertyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('new-prop');
      expect(data.data.name).toBe('New Property');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Property',
      };

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing images', async () => {
      const dataWithoutImages = {
        ...validPropertyData,
        images: [],
      };

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(dataWithoutImages),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('At least one image is required');
    });

    it('should return 409 for duplicate tokenId', async () => {
      const dataWithTokenId = {
        ...validPropertyData,
        tokenId: 1,
      };

      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-prop',
        tokenId: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(dataWithTokenId),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_TOKEN_ID');
    });

    it('should handle creation errors', async () => {
      (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.property.create as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'POST',
        body: JSON.stringify(validPropertyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
