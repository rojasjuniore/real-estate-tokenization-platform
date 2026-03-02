import { renderHook } from '@testing-library/react';
import {
  useListing,
  useActiveListings,
  usePropertyListings,
  useSellerListings,
  useCreateListing,
  useCancelListing,
  useBuyTokens,
  useMarketplaceFee,
  useIsPaymentTokenAccepted,
  useUpdateListingPrice,
  useIsKYCApproved,
} from '../useMarketplace';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Mock wagmi hooks
jest.mock('wagmi');

const mockUseReadContract = useReadContract as jest.Mock;
const mockUseWriteContract = useWriteContract as jest.Mock;
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as jest.Mock;

describe('useMarketplace hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
    });
  });

  describe('useListing', () => {
    it('should return undefined listing when listingId is null', () => {
      const { result } = renderHook(() => useListing(null));

      expect(result.current.listing).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return listing data when available', () => {
      const mockListing = {
        seller: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        propertyId: BigInt(1),
        amount: BigInt(100),
        pricePerToken: BigInt(10000000),
        paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
        active: true,
      };

      mockUseReadContract.mockReturnValue({
        data: mockListing,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useListing(BigInt(1)));

      expect(result.current.listing).toEqual(mockListing);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useListing(BigInt(1)));

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      const mockError = new Error('Contract error');
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      });

      const { result } = renderHook(() => useListing(BigInt(1)));

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when listingId is 0', () => {
      const { result } = renderHook(() => useListing(BigInt(0)));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });
  });

  describe('useActiveListings', () => {
    it('should return active listings count', () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(10),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useActiveListings());

      expect(result.current.count).toBe(BigInt(10));
    });

    it('should handle undefined count', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useActiveListings());

      expect(result.current.count).toBeUndefined();
    });
  });

  describe('usePropertyListings', () => {
    it('should return listing IDs for a property', () => {
      const mockListingIds = [BigInt(1), BigInt(2), BigInt(3)];
      mockUseReadContract.mockReturnValue({
        data: mockListingIds,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyListings(BigInt(1)));

      expect(result.current.listingIds).toEqual(mockListingIds);
    });

    it('should handle empty listings', () => {
      mockUseReadContract.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => usePropertyListings(BigInt(999)));

      expect(result.current.listingIds).toEqual([]);
    });
  });

  describe('useSellerListings', () => {
    it('should return listing IDs for a seller', () => {
      const mockListingIds = [BigInt(5), BigInt(6)];
      mockUseReadContract.mockReturnValue({
        data: mockListingIds,
        isLoading: false,
        isError: false,
        error: null,
      });

      const sellerAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
      const { result } = renderHook(() => useSellerListings(sellerAddress));

      expect(result.current.listingIds).toEqual(mockListingIds);
    });
  });

  describe('useCreateListing', () => {
    it('should provide createListing function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useCreateListing());

      expect(result.current.createListing).toBeDefined();
      expect(typeof result.current.createListing).toBe('function');
    });

    it('should call writeContractAsync with correct params', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useCreateListing());

      await result.current.createListing({
        propertyId: BigInt(1),
        amount: BigInt(100),
        pricePerToken: BigInt(10000000),
        paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'createListing',
          args: [
            BigInt(1),
            BigInt(100),
            BigInt(10000000),
            '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          ],
        })
      );
    });

    it('should handle pending state', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: undefined,
        isPending: true,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useCreateListing());

      expect(result.current.isPending).toBe(true);
    });

    it('should track transaction confirmation', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: '0xhash',
        isPending: false,
        isError: false,
        error: null,
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: true,
        isSuccess: false,
        data: undefined,
      });

      const { result } = renderHook(() => useCreateListing());

      expect(result.current.isConfirming).toBe(true);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('useCancelListing', () => {
    it('should provide cancelListing function', () => {
      const mockWriteContractAsync = jest.fn();
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useCancelListing());

      expect(result.current.cancelListing).toBeDefined();
    });

    it('should call cancel with listingId', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useCancelListing());

      await result.current.cancelListing(BigInt(5));

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'cancelListing',
          args: [BigInt(5)],
        })
      );
    });
  });

  describe('useBuyTokens', () => {
    it('should provide buy function', () => {
      const mockWriteContractAsync = jest.fn();
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useBuyTokens());

      expect(result.current.buy).toBeDefined();
    });

    it('should call buy with correct params', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useBuyTokens());

      await result.current.buy({
        listingId: BigInt(1),
        amount: BigInt(10),
        value: BigInt(100000000),
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'buy',
          args: [BigInt(1), BigInt(10)],
          value: BigInt(100000000),
        })
      );
    });

    it('should handle buy without value (ERC20 payment)', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useBuyTokens());

      await result.current.buy({
        listingId: BigInt(1),
        amount: BigInt(10),
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'buy',
          args: [BigInt(1), BigInt(10)],
          value: undefined,
        })
      );
    });
  });

  describe('useMarketplaceFee', () => {
    it('should return fee in basis points', () => {
      mockUseReadContract.mockReturnValue({
        data: 250, // 2.5%
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useMarketplaceFee());

      expect(result.current.fee).toBe(250);
      expect(result.current.feePercentage).toBe(2.5);
    });

    it('should handle undefined fee', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useMarketplaceFee());

      expect(result.current.fee).toBeUndefined();
      expect(result.current.feePercentage).toBeUndefined();
    });
  });

  describe('useIsPaymentTokenAccepted', () => {
    it('should return true for accepted token', () => {
      mockUseReadContract.mockReturnValue({
        data: true,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useIsPaymentTokenAccepted('0xc2132D05D31c914a87C6611C10748AEb04B58e8F')
      );

      expect(result.current.isAccepted).toBe(true);
    });

    it('should return false for non-accepted token', () => {
      mockUseReadContract.mockReturnValue({
        data: false,
        isLoading: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useIsPaymentTokenAccepted('0x0000000000000000000000000000000000000000')
      );

      expect(result.current.isAccepted).toBe(false);
    });
  });

  describe('useUpdateListingPrice', () => {
    it('should provide updatePrice function', () => {
      const mockWriteContractAsync = jest.fn();
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useUpdateListingPrice());

      expect(result.current.updatePrice).toBeDefined();
    });

    it('should call updatePrice with correct params', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useUpdateListingPrice());

      await result.current.updatePrice({
        listingId: BigInt(1),
        newPricePerToken: BigInt(15000000),
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'updateListingPrice',
          args: [BigInt(1), BigInt(15000000)],
        })
      );
    });
  });

  describe('useIsKYCApproved', () => {
    it('should return true for approved address', () => {
      mockUseReadContract.mockReturnValue({
        data: true,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useIsKYCApproved('0x1234567890123456789012345678901234567890')
      );

      expect(result.current.isKYCApproved).toBe(true);
    });

    it('should return false for non-approved address', () => {
      mockUseReadContract.mockReturnValue({
        data: false,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() =>
        useIsKYCApproved('0x0000000000000000000000000000000000000001')
      );

      expect(result.current.isKYCApproved).toBe(false);
    });

    it('should not fetch when address is undefined', () => {
      const { result } = renderHook(() => useIsKYCApproved(undefined));

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });

    it('should provide refetch function', () => {
      const mockRefetch = jest.fn();
      mockUseReadContract.mockReturnValue({
        data: true,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        useIsKYCApproved('0x1234567890123456789012345678901234567890')
      );

      expect(result.current.refetch).toBeDefined();
    });
  });
});
