import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useFaucetConfig,
  useUsdcClaimAmount,
  usePropertyClaimAmount,
  useAvailableProperties,
  useUsdcCooldown,
  usePropertyCooldown,
  useFaucetBalances,
  useClaimUsdc,
  useClaimPropertyTokens,
} from '../useFaucet';

// Mock wagmi hooks
const mockUseChainId = jest.fn();
const mockUseAccount = jest.fn();
const mockUseReadContract = jest.fn();
const mockUseWriteContract = jest.fn();
const mockUseWaitForTransactionReceipt = jest.fn();

jest.mock('wagmi', () => ({
  useChainId: () => mockUseChainId(),
  useAccount: () => mockUseAccount(),
  useReadContract: (config: unknown) => mockUseReadContract(config),
  useWriteContract: () => mockUseWriteContract(),
  useWaitForTransactionReceipt: (config: unknown) => mockUseWaitForTransactionReceipt(config),
}));

jest.mock('wagmi/chains', () => ({
  polygonAmoy: { id: 80002 },
}));

// Set environment variable
const originalEnv = process.env;

describe('useFaucet hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FAUCET_ADDRESS_AMOY: '0xFaucetAddress123456789012345678901234567890',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('useFaucetConfig', () => {
    it('should return isAvailable true when on Amoy and address is set', () => {
      mockUseChainId.mockReturnValue(80002);

      const { result } = renderHook(() => useFaucetConfig());

      expect(result.current.isAmoy).toBe(true);
    });

    it('should return isAvailable false when not on Amoy', () => {
      mockUseChainId.mockReturnValue(1); // mainnet

      const { result } = renderHook(() => useFaucetConfig());

      expect(result.current.isAmoy).toBe(false);
    });
  });

  describe('useUsdcClaimAmount', () => {
    it('should return claim amount from contract', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: BigInt(1000000),
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useUsdcClaimAmount());

      expect(result.current.amount).toBe(BigInt(1000000));
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should return loading state', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      const { result } = renderHook(() => useUsdcClaimAmount());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.amount).toBeUndefined();
    });

    it('should return error state', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      });

      const { result } = renderHook(() => useUsdcClaimAmount());

      expect(result.current.isError).toBe(true);
    });
  });

  describe('usePropertyClaimAmount', () => {
    it('should return property claim amount from contract', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: BigInt(5),
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => usePropertyClaimAmount());

      expect(result.current.amount).toBe(BigInt(5));
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useAvailableProperties', () => {
    it('should return available property IDs', () => {
      mockUseChainId.mockReturnValue(80002);
      const mockRefetch = jest.fn();
      mockUseReadContract.mockReturnValue({
        data: [BigInt(1), BigInt(2), BigInt(3)],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useAvailableProperties());

      expect(result.current.propertyIds).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
      expect(result.current.refetch).toBe(mockRefetch);
    });

    it('should return empty array when no properties', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useAvailableProperties());

      expect(result.current.propertyIds).toEqual([]);
    });
  });

  describe('useUsdcCooldown', () => {
    it('should return cooldown for connected user', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseAccount.mockReturnValue({ address: '0xUser123' });
      const mockRefetch = jest.fn();
      mockUseReadContract.mockReturnValue({
        data: BigInt(3600),
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useUsdcCooldown());

      expect(result.current.cooldown).toBe(BigInt(3600));
    });

    it('should handle no connected user', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseAccount.mockReturnValue({ address: undefined });
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useUsdcCooldown());

      expect(result.current.cooldown).toBeUndefined();
    });
  });

  describe('usePropertyCooldown', () => {
    it('should return cooldown for specific property', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseAccount.mockReturnValue({ address: '0xUser123' });
      mockUseReadContract.mockReturnValue({
        data: BigInt(7200),
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => usePropertyCooldown(BigInt(1)));

      expect(result.current.cooldown).toBe(BigInt(7200));
    });
  });

  describe('useFaucetBalances', () => {
    it('should return both USDC and property balances', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: [BigInt(10000000), BigInt(500)],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useFaucetBalances(BigInt(1)));

      expect(result.current.usdcBalance).toBe(BigInt(10000000));
      expect(result.current.propertyBalance).toBe(BigInt(500));
    });

    it('should handle undefined data', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useFaucetBalances(BigInt(1)));

      expect(result.current.usdcBalance).toBeUndefined();
      expect(result.current.propertyBalance).toBeUndefined();
    });
  });

  describe('useClaimUsdc', () => {
    it('should provide claimUsdc function', async () => {
      mockUseChainId.mockReturnValue(80002);
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimUsdc());

      expect(typeof result.current.claimUsdc).toBe('function');
      expect(result.current.isPending).toBe(false);
    });

    it('should throw error when faucet not available', async () => {
      mockUseChainId.mockReturnValue(1); // Not Amoy
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimUsdc());

      await expect(result.current.claimUsdc()).rejects.toThrow(
        'Faucet not available on this network'
      );
    });

    it('should return transaction states', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: '0xhash123',
        isPending: true,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: true,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimUsdc());

      expect(result.current.hash).toBe('0xhash123');
      expect(result.current.isPending).toBe(true);
      expect(result.current.isConfirming).toBe(true);
    });

    it('should return success state after confirmation', () => {
      mockUseChainId.mockReturnValue(80002);
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: '0xhash123',
        isPending: false,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: true,
      });

      const { result } = renderHook(() => useClaimUsdc());

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useClaimPropertyTokens', () => {
    it('should provide claimPropertyTokens function', () => {
      mockUseChainId.mockReturnValue(80002);
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimPropertyTokens());

      expect(typeof result.current.claimPropertyTokens).toBe('function');
    });

    it('should throw error when faucet not available', async () => {
      mockUseChainId.mockReturnValue(1); // Not Amoy
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimPropertyTokens());

      await expect(result.current.claimPropertyTokens(BigInt(1))).rejects.toThrow(
        'Faucet not available on this network'
      );
    });

    it('should return error state', () => {
      mockUseChainId.mockReturnValue(80002);
      const mockError = new Error('Transaction failed');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        data: undefined,
        isPending: false,
        isError: true,
        error: mockError,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useClaimPropertyTokens());

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });
});
