'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PropertyMarketplaceABI } from '@/lib/web3/abis';
import { CONTRACT_ADDRESSES } from '@/lib/web3/config';

interface Listing {
  seller: `0x${string}`;
  propertyId: bigint;
  amount: bigint;
  pricePerToken: bigint;
  paymentToken: `0x${string}`;
  active: boolean;
}

export function useListing(listingId: bigint | null) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'getListing',
    args: listingId !== null ? [listingId] : undefined,
    query: {
      enabled: listingId !== null && listingId > BigInt(0),
    },
  });

  // Log for debugging
  console.log('[useListing] listingId:', listingId?.toString(), 'data:', data, 'isLoading:', isLoading, 'error:', error);

  return {
    listing: data as Listing | undefined,
    isLoading,
    isError,
    error,
  };
}

export function useActiveListings() {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'getActiveListingsCount',
  });

  return {
    count: data as bigint | undefined,
    isLoading,
    isError,
    error,
  };
}

export function usePropertyListings(propertyId: bigint) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'getPropertyListings',
    args: [propertyId],
  });

  return {
    listingIds: data as bigint[] | undefined,
    isLoading,
    isError,
    error,
  };
}

export function useSellerListings(seller: `0x${string}`) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'getSellerListings',
    args: [seller],
  });

  return {
    listingIds: data as bigint[] | undefined,
    isLoading,
    isError,
    error,
  };
}

interface CreateListingParams {
  propertyId: bigint;
  amount: bigint;
  pricePerToken: bigint;
  paymentToken: `0x${string}`;
}

export function useCreateListing() {
  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createListing = async (params: CreateListingParams) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.marketplace,
      abi: PropertyMarketplaceABI,
      functionName: 'createListing',
      args: [params.propertyId, params.amount, params.pricePerToken, params.paymentToken],
    });
  };

  return {
    createListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

export function useCancelListing() {
  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelListing = async (listingId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.marketplace,
      abi: PropertyMarketplaceABI,
      functionName: 'cancelListing',
      args: [listingId],
    });
  };

  return {
    cancelListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

interface BuyParams {
  listingId: bigint;
  amount: bigint;
  value?: bigint; // For native token (MATIC) payments
}

export function useBuyTokens() {
  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buy = async (params: BuyParams) => {
    console.log('[useBuyTokens] buy called with:', {
      listingId: params.listingId.toString(),
      amount: params.amount.toString(),
      value: params.value?.toString(),
      marketplaceAddress: CONTRACT_ADDRESSES.marketplace,
    });

    try {
      const result = await writeContractAsync({
        address: CONTRACT_ADDRESSES.marketplace,
        abi: PropertyMarketplaceABI,
        functionName: 'buy',
        args: [params.listingId, params.amount],
        value: params.value,
      });
      console.log('[useBuyTokens] Transaction submitted:', result);
      return result;
    } catch (err) {
      console.error('[useBuyTokens] Error:', err);
      throw err;
    }
  };

  return {
    buy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

export function useMarketplaceFee() {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'marketplaceFee',
  });

  return {
    fee: data as number | undefined,
    feePercentage: data ? Number(data) / 100 : undefined, // Convert basis points to percentage
    isLoading,
    isError,
    error,
  };
}

export function useIsPaymentTokenAccepted(tokenAddress: `0x${string}`) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'isPaymentTokenAccepted',
    args: [tokenAddress],
  });

  return {
    isAccepted: data as boolean | undefined,
    isLoading,
    isError,
    error,
  };
}

interface UpdateListingPriceParams {
  listingId: bigint;
  newPricePerToken: bigint;
}

export function useUpdateListingPrice() {
  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const updatePrice = async (params: UpdateListingPriceParams) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.marketplace,
      abi: PropertyMarketplaceABI,
      functionName: 'updateListingPrice',
      args: [params.listingId, params.newPricePerToken],
    });
  };

  return {
    updatePrice,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

export function useIsKYCApproved(walletAddress: `0x${string}` | undefined) {
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: PropertyMarketplaceABI,
    functionName: 'isKYCApproved',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  return {
    isKYCApproved: data as boolean | undefined,
    isLoading,
    isError,
    error,
    refetch,
  };
}
