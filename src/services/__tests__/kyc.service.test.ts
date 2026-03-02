import { kycService } from '../kyc.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    kYCSubmission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('kycService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submit', () => {
    const mockSubmissionData = {
      idFrontUrl: 'https://example.com/front.jpg',
      idBackUrl: 'https://example.com/back.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    };

    it('should create KYC submission and update user status', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(null);

      const mockSubmission = {
        id: 'kyc-1',
        userId: 'user-1',
        ...mockSubmissionData,
        status: 'PENDING',
      };

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockSubmission, {}]);

      const result = await kycService.submit('user-1', mockSubmissionData);

      expect(result).toEqual(mockSubmission);
      expect(mockPrisma.kYCSubmission.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw error if KYC already submitted', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-kyc',
        userId: 'user-1',
        status: 'PENDING',
      });

      await expect(
        kycService.submit('user-1', mockSubmissionData)
      ).rejects.toThrow('KYC already submitted');
    });
  });

  describe('getByUserId', () => {
    it('should return KYC submission with user details', async () => {
      const mockSubmission = {
        id: 'kyc-1',
        userId: 'user-1',
        status: 'PENDING',
        user: {
          id: 'user-1',
          walletAddress: '0x123',
          email: 'user@test.com',
          name: 'Test User',
        },
      };

      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await kycService.getByUserId('user-1');

      expect(result).toEqual(mockSubmission);
      expect(mockPrisma.kYCSubmission.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should return null for user without KYC', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await kycService.getByUserId('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getPending', () => {
    const mockSubmissions = [
      {
        id: 'kyc-1',
        userId: 'user-1',
        status: 'PENDING',
        user: { id: 'user-1', walletAddress: '0x123', email: 'user1@test.com', name: 'User 1' },
      },
      {
        id: 'kyc-2',
        userId: 'user-2',
        status: 'PENDING',
        user: { id: 'user-2', walletAddress: '0x456', email: 'user2@test.com', name: 'User 2' },
      },
    ];

    it('should return paginated pending submissions', async () => {
      (mockPrisma.kYCSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.kYCSubmission.count as jest.Mock).mockResolvedValue(2);

      const result = await kycService.getPending();

      expect(result).toEqual({
        submissions: mockSubmissions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockPrisma.kYCSubmission.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination', async () => {
      (mockPrisma.kYCSubmission.findMany as jest.Mock).mockResolvedValue([mockSubmissions[1]]);
      (mockPrisma.kYCSubmission.count as jest.Mock).mockResolvedValue(25);

      const result = await kycService.getPending(2, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);

      expect(mockPrisma.kYCSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('review', () => {
    const mockPendingSubmission = {
      id: 'kyc-1',
      userId: 'user-1',
      status: 'PENDING',
    };

    it('should approve KYC submission and update user status', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(mockPendingSubmission);

      const updatedSubmission = {
        ...mockPendingSubmission,
        status: 'APPROVED',
        reviewedBy: '0xadmin',
        reviewedAt: expect.any(Date),
      };

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([updatedSubmission, {}]);

      const result = await kycService.review('kyc-1', 'APPROVED', '0xadmin', 'All documents verified');

      expect(result).toEqual(updatedSubmission);
    });

    it('should reject KYC submission with notes', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(mockPendingSubmission);

      const updatedSubmission = {
        ...mockPendingSubmission,
        status: 'REJECTED',
        adminNotes: 'Documents unclear',
        reviewedBy: '0xadmin',
      };

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([updatedSubmission, {}]);

      const result = await kycService.review('kyc-1', 'REJECTED', '0xadmin', 'Documents unclear');

      expect(result).toEqual(updatedSubmission);
    });

    it('should throw error if submission not found', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        kycService.review('non-existent', 'APPROVED', '0xadmin')
      ).rejects.toThrow('KYC submission not found');
    });

    it('should throw error if already reviewed', async () => {
      (mockPrisma.kYCSubmission.findUnique as jest.Mock).mockResolvedValue({
        id: 'kyc-1',
        userId: 'user-1',
        status: 'APPROVED',
      });

      await expect(
        kycService.review('kyc-1', 'APPROVED', '0xadmin')
      ).rejects.toThrow('KYC already reviewed');
    });
  });

  describe('getStats', () => {
    it('should return KYC statistics', async () => {
      (mockPrisma.kYCSubmission.count as jest.Mock)
        .mockResolvedValueOnce(5)   // pending
        .mockResolvedValueOnce(80)  // approved
        .mockResolvedValueOnce(15)  // rejected
        .mockResolvedValueOnce(100); // total

      const result = await kycService.getStats();

      expect(result).toEqual({
        pending: 5,
        approved: 80,
        rejected: 15,
        total: 100,
        approvalRate: 80,
      });
    });

    it('should handle zero total submissions', async () => {
      (mockPrisma.kYCSubmission.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await kycService.getStats();

      expect(result).toEqual({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        approvalRate: 0,
      });
    });
  });
});
