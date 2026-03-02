import { renderHook } from '@testing-library/react';
import {
  usePropertyBalance,
  usePropertyInfo,
  usePropertyTotalSupply,
  usePropertyUri,
} from '../usePropertyToken';
import { useReadContract } from 'wagmi';

// Mock wagmi hooks
jest.mock('wagmi');

const mockUseReadContract = useReadContract as jest.Mock;

describe('usePropertyToken hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe('usePropertyBalance', () => {
    it('should return balance for a property and address', () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(100),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() =>
        usePropertyBalance({
          propertyId: BigInt(1),
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        })
      );

      expect(result.current.balance).toBe(BigInt(100));
      expect(result.current.isLoading).toBe(false);
    });

    it('should call contract with correct args', () => {
      const propertyId = BigInt(5);
      const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;

      renderHook(() => usePropertyBalance({ propertyId, address }));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'balanceOf',
          args: [address, propertyId],
        })
      );
    });

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() =>
        usePropertyBalance({
          propertyId: BigInt(1),
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.balance).toBeUndefined();
    });

    it('should handle error state', () => {
      const mockError = new Error('Balance fetch failed');
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      const { result } = renderHook(() =>
        usePropertyBalance({
          propertyId: BigInt(1),
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        })
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });

    it('should return zero balance when user has no tokens', () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() =>
        usePropertyBalance({
          propertyId: BigInt(1),
          address: '0x0000000000000000000000000000000000000001' as `0x${string}`,
        })
      );

      expect(result.current.balance).toBe(BigInt(0));
    });
  });

  describe('usePropertyInfo', () => {
    it('should return property info', () => {
      const mockProperty = {
        totalSupply: BigInt(1000),
        uri: 'ipfs://Qm...',
        royaltyFee: 500, // 5%
        exists: true,
      };

      mockUseReadContract.mockReturnValue({
        data: mockProperty,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyInfo(BigInt(1)));

      expect(result.current.property).toEqual(mockProperty);
    });

    it('should call getProperty with propertyId', () => {
      const propertyId = BigInt(10);

      renderHook(() => usePropertyInfo(propertyId));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'getProperty',
          args: [propertyId],
        })
      );
    });

    it('should return undefined for non-existent property', () => {
      mockUseReadContract.mockReturnValue({
        data: {
          totalSupply: BigInt(0),
          uri: '',
          royaltyFee: 0,
          exists: false,
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyInfo(BigInt(999)));

      expect(result.current.property?.exists).toBe(false);
    });
  });

  describe('usePropertyTotalSupply', () => {
    it('should return total supply for a property', () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(5000),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyTotalSupply(BigInt(1)));

      expect(result.current.totalSupply).toBe(BigInt(5000));
    });

    it('should call totalSupply with propertyId', () => {
      const propertyId = BigInt(3);

      renderHook(() => usePropertyTotalSupply(propertyId));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'totalSupply',
          args: [propertyId],
        })
      );
    });

    it('should handle undefined total supply', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyTotalSupply(BigInt(1)));

      expect(result.current.totalSupply).toBeUndefined();
    });
  });

  describe('usePropertyUri', () => {
    it('should return URI for a property', () => {
      const mockUri = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/1';

      mockUseReadContract.mockReturnValue({
        data: mockUri,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyUri(BigInt(1)));

      expect(result.current.uri).toBe(mockUri);
    });

    it('should call uri with propertyId', () => {
      const propertyId = BigInt(7);

      renderHook(() => usePropertyUri(propertyId));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'uri',
          args: [propertyId],
        })
      );
    });

    it('should handle empty URI', () => {
      mockUseReadContract.mockReturnValue({
        data: '',
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyUri(BigInt(1)));

      expect(result.current.uri).toBe('');
    });

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyUri(BigInt(1)));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.uri).toBeUndefined();
    });
  });
});
