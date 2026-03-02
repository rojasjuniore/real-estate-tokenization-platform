'use client';

import { useReadContract } from 'wagmi';
import { PropertyTokenABI } from '@/lib/web3/abis';
import { CONTRACT_ADDRESSES } from '@/lib/web3/config';

interface PropertyBalanceParams {
  propertyId: bigint;
  address: `0x${string}`;
}

interface Property {
  totalSupply: bigint;
  uri: string;
  royaltyFee: number;
  exists: boolean;
}

export function usePropertyBalance({ propertyId, address }: PropertyBalanceParams) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.propertyToken,
    abi: PropertyTokenABI,
    functionName: 'balanceOf',
    args: [address, propertyId],
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    isError,
    error,
  };
}

export function usePropertyInfo(propertyId: bigint) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.propertyToken,
    abi: PropertyTokenABI,
    functionName: 'getProperty',
    args: [propertyId],
  });

  return {
    property: data as Property | undefined,
    isLoading,
    isError,
    error,
  };
}

export function usePropertyTotalSupply(propertyId: bigint) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.propertyToken,
    abi: PropertyTokenABI,
    functionName: 'totalSupply',
    args: [propertyId],
  });

  return {
    totalSupply: data as bigint | undefined,
    isLoading,
    isError,
    error,
  };
}

export function usePropertyUri(propertyId: bigint) {
  const { data, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESSES.propertyToken,
    abi: PropertyTokenABI,
    functionName: 'uri',
    args: [propertyId],
  });

  return {
    uri: data as string | undefined,
    isLoading,
    isError,
    error,
  };
}
