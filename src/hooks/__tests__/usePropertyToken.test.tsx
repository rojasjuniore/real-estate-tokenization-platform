import { renderHook } from '@testing-library/react';
import { usePropertyBalance, usePropertyInfo, usePropertyTotalSupply, usePropertyUri } from '../usePropertyToken';
import { useReadContract } from 'wagmi';

// Get the mock
const mockUseReadContract = useReadContract as jest.Mock;

describe('usePropertyBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return balance for a property', () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(1000),
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

    expect(result.current.balance).toBe(BigInt(1000));
    expect(result.current.isLoading).toBe(false);
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
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Contract read error'),
    });

    const { result } = renderHook(() =>
      usePropertyBalance({
        propertyId: BigInt(1),
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      })
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});

describe('usePropertyInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return property information', () => {
    mockUseReadContract.mockReturnValue({
      data: {
        totalSupply: BigInt(10000),
        uri: 'ipfs://QmTest',
        royaltyFee: 250,
        exists: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePropertyInfo(BigInt(1)));

    expect(result.current.property?.totalSupply).toBe(BigInt(10000));
    expect(result.current.property?.uri).toBe('ipfs://QmTest');
    expect(result.current.property?.royaltyFee).toBe(250);
    expect(result.current.property?.exists).toBe(true);
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return total supply for a property', () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(10000),
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePropertyTotalSupply(BigInt(1)));

    expect(result.current.totalSupply).toBe(BigInt(10000));
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePropertyTotalSupply(BigInt(1)));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.totalSupply).toBeUndefined();
  });
});

describe('usePropertyUri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return URI for a property', () => {
    mockUseReadContract.mockReturnValue({
      data: 'ipfs://QmTestUri123',
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => usePropertyUri(BigInt(1)));

    expect(result.current.uri).toBe('ipfs://QmTestUri123');
    expect(result.current.isLoading).toBe(false);
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
