/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../kyc/status/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('GET /api/kyc/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when wallet address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {},
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
    expect(data.error.message).toBe('Wallet address required');
  });

  it('should return 404 when user not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {
        'x-wallet-address': '0xNonExistentUser',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('USER_NOT_FOUND');
  });

  it('should return KYC status for existing user', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: '0xuser123',
      kycStatus: 'APPROVED',
      kycSubmission: {
        id: 'kyc-1',
        status: 'APPROVED',
        adminNotes: null,
        createdAt: new Date('2024-01-01'),
        reviewedAt: new Date('2024-01-02'),
      },
    };

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {
        'x-wallet-address': '0xUser123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.kycStatus).toBe('APPROVED');
    expect(data.data.submission.id).toBe('kyc-1');
    expect(data.data.submission.status).toBe('APPROVED');
  });

  it('should normalize wallet address to lowercase', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: '0xuser123',
      kycStatus: 'PENDING',
      kycSubmission: null,
    };

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {
        'x-wallet-address': '0xUSER123',
      },
    });

    await GET(request);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { walletAddress: '0xuser123' },
      include: {
        kycSubmission: {
          select: {
            id: true,
            status: true,
            adminNotes: true,
            createdAt: true,
            reviewedAt: true,
          },
        },
      },
    });
  });

  it('should return NONE status when user has no KYC submission', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: '0xuser123',
      kycStatus: 'NONE',
      kycSubmission: null,
    };

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {
        'x-wallet-address': '0xUser123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.kycStatus).toBe('NONE');
    expect(data.data.submission).toBeNull();
  });

  it('should handle database errors', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/kyc/status', {
      headers: {
        'x-wallet-address': '0xUser123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('KYC_STATUS_ERROR');
    expect(data.error.message).toBe('Failed to get KYC status');
  });
});
