import { renderHook } from '@testing-library/react';
import {
  useDistribution,
  useClaimableAmount,
  useHasClaimed,
  useUnclaimedDistributions,
  usePropertyDistributions,
  useClaimRoyalty,
  useDistributionCount,
} from '../useRoyalties';

// Mock wagmi hooks
const mockReadContractData = jest.fn();
const mockWriteContractAsync = jest.fn();

jest.mock('wagmi', () => ({
  useReadContract: jest.fn(() => ({
    data: mockReadContractData(),
    isLoading: false,
    error: null,
  })),
  useWriteContract: jest.fn(() => ({
    writeContractAsync: mockWriteContractAsync,
    isPending: false,
  })),
  useAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
  })),
}));

describe('useRoyalties hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadContractData.mockReturnValue(undefined);
  });

  describe('useDistribution', () => {
    it('should return distribution data', () => {
      const mockDistribution = {
        propertyId: BigInt(1),
        totalAmount: BigInt(10000000000),
        paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        totalSupplySnapshot: BigInt(10000),
        createdAt: BigInt(1700000000),
      };
      mockReadContractData.mockReturnValue(mockDistribution);

      const { result } = renderHook(() => useDistribution(BigInt(1)));

      expect(result.current.data).toEqual(mockDistribution);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      const { useReadContract } = require('wagmi');
      useReadContract.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useDistribution(BigInt(1)));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useClaimableAmount', () => {
    it('should return claimable amount for user', () => {
      mockReadContractData.mockReturnValue(BigInt(5000000000)); // 5000 USDT

      const { result } = renderHook(() =>
        useClaimableAmount(
          BigInt(1),
          '0x1234567890123456789012345678901234567890' as `0x${string}`
        )
      );

      expect(result.current.data).toEqual(BigInt(5000000000));
    });

    it('should return zero if user has no claimable amount', () => {
      mockReadContractData.mockReturnValue(BigInt(0));

      const { result } = renderHook(() =>
        useClaimableAmount(
          BigInt(1),
          '0x0000000000000000000000000000000000000000' as `0x${string}`
        )
      );

      expect(result.current.data).toEqual(BigInt(0));
    });
  });

  describe('useHasClaimed', () => {
    it('should return true if user has claimed', () => {
      mockReadContractData.mockReturnValue(true);

      const { result } = renderHook(() =>
        useHasClaimed(
          BigInt(1),
          '0x1234567890123456789012345678901234567890' as `0x${string}`
        )
      );

      expect(result.current.data).toBe(true);
    });

    it('should return false if user has not claimed', () => {
      mockReadContractData.mockReturnValue(false);

      const { result } = renderHook(() =>
        useHasClaimed(
          BigInt(1),
          '0x1234567890123456789012345678901234567890' as `0x${string}`
        )
      );

      expect(result.current.data).toBe(false);
    });
  });

  describe('useUnclaimedDistributions', () => {
    it('should return array of unclaimed distribution IDs', () => {
      mockReadContractData.mockReturnValue([BigInt(1), BigInt(2), BigInt(3)]);

      const { result } = renderHook(() =>
        useUnclaimedDistributions(
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
          BigInt(1)
        )
      );

      expect(result.current.data).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
    });

    it('should return empty array if no unclaimed distributions', () => {
      mockReadContractData.mockReturnValue([]);

      const { result } = renderHook(() =>
        useUnclaimedDistributions(
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
          BigInt(1)
        )
      );

      expect(result.current.data).toEqual([]);
    });
  });

  describe('usePropertyDistributions', () => {
    it('should return all distribution IDs for a property', () => {
      mockReadContractData.mockReturnValue([BigInt(1), BigInt(4), BigInt(7)]);

      const { result } = renderHook(() => usePropertyDistributions(BigInt(1)));

      expect(result.current.data).toEqual([BigInt(1), BigInt(4), BigInt(7)]);
    });
  });

  describe('useDistributionCount', () => {
    it('should return total distribution count', () => {
      mockReadContractData.mockReturnValue(BigInt(10));

      const { result } = renderHook(() => useDistributionCount());

      expect(result.current.data).toEqual(BigInt(10));
    });
  });

  describe('useClaimRoyalty', () => {
    it('should return claim function and pending state', () => {
      const { result } = renderHook(() => useClaimRoyalty());

      expect(result.current.claim).toBeDefined();
      expect(typeof result.current.claim).toBe('function');
      expect(result.current.isPending).toBe(false);
    });

    it('should call writeContractAsync with correct params when claiming', async () => {
      mockWriteContractAsync.mockResolvedValue('0xtxhash');

      const { result } = renderHook(() => useClaimRoyalty());

      await result.current.claim(BigInt(1));

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'claim',
          args: [BigInt(1)],
        })
      );
    });
  });
});
