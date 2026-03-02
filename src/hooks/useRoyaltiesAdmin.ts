'use client';

import { useWriteContract, useReadContract } from 'wagmi';
import { ROYALTY_DISTRIBUTOR_ABI } from '@/lib/web3/abis';

const ROYALTY_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

/**
 * Hook to create a new distribution (admin only)
 */
export function useCreateDistribution() {
  const { writeContractAsync, isPending } = useWriteContract();

  const createDistribution = async (
    propertyId: bigint,
    amount: bigint,
    paymentToken: `0x${string}`
  ) => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'createDistribution',
      args: [propertyId, amount, paymentToken],
    });
  };

  return { createDistribution, isPending };
}

/**
 * Hook to add a payment token to accepted list (admin only)
 */
export function useAddPaymentToken() {
  const { writeContractAsync, isPending } = useWriteContract();

  const addPaymentToken = async (token: `0x${string}`) => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'addPaymentToken',
      args: [token],
    });
  };

  return { addPaymentToken, isPending };
}

/**
 * Hook to remove a payment token (admin only)
 */
export function useRemovePaymentToken() {
  const { writeContractAsync, isPending } = useWriteContract();

  const removePaymentToken = async (token: `0x${string}`) => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'removePaymentToken',
      args: [token],
    });
  };

  return { removePaymentToken, isPending };
}

/**
 * Hook to pause the contract (admin only)
 */
export function usePauseDistributor() {
  const { writeContractAsync, isPending } = useWriteContract();

  const pause = async () => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'pause',
    });
  };

  return { pause, isPending };
}

/**
 * Hook to unpause the contract (admin only)
 */
export function useUnpauseDistributor() {
  const { writeContractAsync, isPending } = useWriteContract();

  const unpause = async () => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'unpause',
    });
  };

  return { unpause, isPending };
}

/**
 * Check if contract is paused
 */
export function useIsPaused() {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'paused',
  });
}
