'use client';

import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { ROYALTY_DISTRIBUTOR_ABI } from '@/lib/web3/abis';

// Contract address will be set after deployment
const ROYALTY_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

interface Distribution {
  propertyId: bigint;
  totalAmount: bigint;
  paymentToken: `0x${string}`;
  totalSupplySnapshot: bigint;
  createdAt: bigint;
}

/**
 * Get distribution details by ID
 */
export function useDistribution(distributionId: bigint) {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'getDistribution',
    args: [distributionId],
  }) as { data: Distribution | undefined; isLoading: boolean; error: Error | null };
}

/**
 * Get claimable amount for a user from a specific distribution
 */
export function useClaimableAmount(distributionId: bigint, userAddress: `0x${string}`) {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'getClaimableAmount',
    args: [distributionId, userAddress],
  });
}

/**
 * Check if a user has claimed from a specific distribution
 */
export function useHasClaimed(distributionId: bigint, userAddress: `0x${string}`) {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'hasClaimed',
    args: [distributionId, userAddress],
  });
}

/**
 * Get all unclaimed distribution IDs for a user on a specific property
 */
export function useUnclaimedDistributions(userAddress: `0x${string}`, propertyId: bigint) {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'getUnclaimedDistributions',
    args: [userAddress, propertyId],
  });
}

/**
 * Get all distribution IDs for a property
 */
export function usePropertyDistributions(propertyId: bigint) {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'getPropertyDistributions',
    args: [propertyId],
  });
}

/**
 * Get total distribution count
 */
export function useDistributionCount() {
  return useReadContract({
    address: ROYALTY_DISTRIBUTOR_ADDRESS,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    functionName: 'distributionCount',
  });
}

/**
 * Hook to claim royalties from a distribution
 */
export function useClaimRoyalty() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claim = async (distributionId: bigint) => {
    return writeContractAsync({
      address: ROYALTY_DISTRIBUTOR_ADDRESS,
      abi: ROYALTY_DISTRIBUTOR_ABI,
      functionName: 'claim',
      args: [distributionId],
    });
  };

  return { claim, isPending };
}

/**
 * Hook to get current user's claimable amount (convenience hook)
 */
export function useMyClaimableAmount(distributionId: bigint) {
  const { address } = useAccount();
  return useClaimableAmount(
    distributionId,
    address || '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Hook to get current user's unclaimed distributions (convenience hook)
 */
export function useMyUnclaimedDistributions(propertyId: bigint) {
  const { address } = useAccount();
  return useUnclaimedDistributions(
    address || '0x0000000000000000000000000000000000000000',
    propertyId
  );
}
