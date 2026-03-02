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
} from '../useMarketplace';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Get the mocks
const mockUseReadContract = useReadContract as jest.Mock;
const mockUseWriteContract = useWriteContract as jest.Mock;
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as jest.Mock;

describe('useListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return listing information', () => {
    mockUseReadContract.mockReturnValue({
      data: {
        seller: '0x1234567890123456789012345678901234567890',
        propertyId: BigInt(1),
        amount: BigInt(1000),
        pricePerToken: BigInt(100000000),
        paymentToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        active: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useListing(BigInt(1)));

    expect(result.current.listing?.seller).toBe('0x1234567890123456789012345678901234567890');
    expect(result.current.listing?.amount).toBe(BigInt(1000));
    expect(result.current.listing?.active).toBe(true);
  });

  it('should handle inactive listing', () => {
    mockUseReadContract.mockReturnValue({
      data: {
        seller: '0x0000000000000000000000000000000000000000',
        propertyId: BigInt(0),
        amount: BigInt(0),
        pricePerToken: BigInt(0),
        paymentToken: '0x0000000000000000000000000000000000000000',
        active: false,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useListing(BigInt(999)));

    expect(result.current.listing?.active).toBe(false);
  });
});

describe('useActiveListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active listings count', () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(5),
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useActiveListings());

    expect(result.current.count).toBe(BigInt(5));
  });
});

describe('useCreateListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
    });
  });

  it('should have createListing function', () => {
    const { result } = renderHook(() => useCreateListing());

    expect(result.current.createListing).toBeDefined();
    expect(typeof result.current.createListing).toBe('function');
  });

  it('should return pending state', () => {
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: true,
      isError: false,
      error: null,
      data: undefined,
    });

    const { result } = renderHook(() => useCreateListing());

    expect(result.current.isPending).toBe(true);
  });
});

describe('useBuyTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
    });
  });

  it('should have buy function', () => {
    const { result } = renderHook(() => useBuyTokens());

    expect(result.current.buy).toBeDefined();
    expect(typeof result.current.buy).toBe('function');
  });

  it('should return transaction status', () => {
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: '0xabc123',
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
      data: undefined,
    });

    const { result } = renderHook(() => useBuyTokens());

    expect(result.current.isConfirming).toBe(true);
  });
});

describe('usePropertyListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return property listings', () => {
    mockUseReadContract.mockReturnValue({
      data: [BigInt(1), BigInt(2), BigInt(3)],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePropertyListings(BigInt(1)));

    expect(result.current.listingIds).toHaveLength(3);
    expect(result.current.listingIds?.[0]).toBe(BigInt(1));
  });
});

describe('useSellerListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return seller listings', () => {
    mockUseReadContract.mockReturnValue({
      data: [BigInt(5), BigInt(6)],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useSellerListings('0x1234567890123456789012345678901234567890')
    );

    expect(result.current.listingIds).toHaveLength(2);
  });
});

describe('useCancelListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: undefined,
    });
  });

  it('should have cancelListing function', () => {
    const { result } = renderHook(() => useCancelListing());

    expect(result.current.cancelListing).toBeDefined();
    expect(typeof result.current.cancelListing).toBe('function');
  });

  it('should return success state after confirmation', () => {
    mockUseWriteContract.mockReturnValue({
      writeContract: jest.fn(),
      writeContractAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
      data: '0xhash123',
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
      data: { status: 'success' },
    });

    const { result } = renderHook(() => useCancelListing());

    expect(result.current.isSuccess).toBe(true);
  });
});

describe('useMarketplaceFee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return marketplace fee', () => {
    mockUseReadContract.mockReturnValue({
      data: 250,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useMarketplaceFee());

    expect(result.current.fee).toBe(250);
    expect(result.current.feePercentage).toBe(2.5);
  });

  it('should return undefined when no data', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useMarketplaceFee());

    expect(result.current.fee).toBeUndefined();
    expect(result.current.feePercentage).toBeUndefined();
  });
});

describe('useIsPaymentTokenAccepted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
