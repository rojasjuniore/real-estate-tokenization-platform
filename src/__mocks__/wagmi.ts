import React from 'react';

export const useReadContract = jest.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
}));

export const useWriteContract = jest.fn(() => ({
  writeContract: jest.fn(),
  writeContractAsync: jest.fn(),
  data: undefined,
  isPending: false,
  isError: false,
  error: null,
}));

export const useWaitForTransactionReceipt = jest.fn(() => ({
  isLoading: false,
  isSuccess: false,
  data: undefined,
}));

export const useAccount = jest.fn(() => ({
  address: undefined,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
}));

export const useChainId = jest.fn(() => 137);

export const useConnect = jest.fn(() => ({
  connect: jest.fn(),
  connectors: [],
  isPending: false,
  isError: false,
  error: null,
}));

export const useDisconnect = jest.fn(() => ({
  disconnect: jest.fn(),
}));

export const useBalance = jest.fn(() => ({
  data: undefined,
  isLoading: false,
  isError: false,
}));

export const createConfig = jest.fn(() => ({}));

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export const http = jest.fn(() => ({}));
