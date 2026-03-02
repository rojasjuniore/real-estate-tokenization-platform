'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount } from 'wagmi';
import { TestFaucetABI } from '@/lib/web3/abis';
import { polygonAmoy } from 'wagmi/chains';

// TestFaucet contract address on Polygon Amoy - will be set after deployment
const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS_AMOY as `0x${string}` | undefined;

export function useFaucetConfig() {
  const chainId = useChainId();
  const isAmoy = chainId === polygonAmoy.id;

  return {
    isAvailable: isAmoy && !!FAUCET_ADDRESS,
    address: FAUCET_ADDRESS,
    isAmoy,
  };
}

export function useUsdcClaimAmount() {
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'usdcClaimAmount',
    query: {
      enabled: isAvailable,
    },
  });

  return {
    amount: data as bigint | undefined,
    isLoading,
    isError,
  };
}

export function usePropertyClaimAmount() {
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'propertyTokenClaimAmount',
    query: {
      enabled: isAvailable,
    },
  });

  return {
    amount: data as bigint | undefined,
    isLoading,
    isError,
  };
}

export function useAvailableProperties() {
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'getAvailableProperties',
    query: {
      enabled: isAvailable,
    },
  });

  return {
    propertyIds: data as bigint[] | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useUsdcCooldown() {
  const { address: userAddress } = useAccount();
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'getUsdcCooldown',
    args: [userAddress!],
    query: {
      enabled: isAvailable && !!userAddress,
    },
  });

  return {
    cooldown: data as bigint | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function usePropertyCooldown(propertyId: bigint) {
  const { address: userAddress } = useAccount();
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'getPropertyCooldown',
    args: [userAddress!, propertyId],
    query: {
      enabled: isAvailable && !!userAddress,
    },
  });

  return {
    cooldown: data as bigint | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useFaucetBalances(propertyId: bigint) {
  const { address, isAvailable } = useFaucetConfig();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: address!,
    abi: TestFaucetABI,
    functionName: 'getFaucetBalances',
    args: [propertyId],
    query: {
      enabled: isAvailable,
    },
  });

  return {
    usdcBalance: data?.[0] as bigint | undefined,
    propertyBalance: data?.[1] as bigint | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useClaimUsdc() {
  const { address, isAvailable } = useFaucetConfig();

  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimUsdc = async () => {
    if (!isAvailable) {
      throw new Error('Faucet not available on this network');
    }

    return writeContractAsync({
      address: address!,
      abi: TestFaucetABI,
      functionName: 'claimUsdc',
    });
  };

  return {
    claimUsdc,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}

export function useClaimPropertyTokens() {
  const { address, isAvailable } = useFaucetConfig();

  const { writeContractAsync, data: hash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPropertyTokens = async (propertyId: bigint) => {
    if (!isAvailable) {
      throw new Error('Faucet not available on this network');
    }

    return writeContractAsync({
      address: address!,
      abi: TestFaucetABI,
      functionName: 'claimPropertyTokens',
      args: [propertyId],
    });
  };

  return {
    claimPropertyTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}
