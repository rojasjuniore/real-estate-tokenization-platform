import { renderHook, act } from '@testing-library/react';
import {
  useCreateDistribution,
  useAddPaymentToken,
  useRemovePaymentToken,
  usePauseDistributor,
  useUnpauseDistributor,
  useIsPaused,
} from '../useRoyaltiesAdmin';

// Mock wagmi hooks
const mockUseWriteContract = jest.fn();
const mockUseReadContract = jest.fn();

jest.mock('wagmi', () => ({
  useWriteContract: () => mockUseWriteContract(),
  useReadContract: (config: unknown) => mockUseReadContract(config),
}));

describe('useRoyaltiesAdmin hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCreateDistribution', () => {
    it('should provide createDistribution function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateDistribution());

      expect(typeof result.current.createDistribution).toBe('function');
      expect(result.current.isPending).toBe(false);
    });

    it('should call writeContractAsync with correct parameters', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useCreateDistribution());

      await act(async () => {
        await result.current.createDistribution(
          BigInt(1),
          BigInt(1000000),
          '0xUSDTAddress123456789012345678901234567890' as `0x${string}`
        );
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'createDistribution',
          args: [
            BigInt(1),
            BigInt(1000000),
            '0xUSDTAddress123456789012345678901234567890',
          ],
        })
      );
    });

    it('should return pending state when transaction is processing', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useCreateDistribution());

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useAddPaymentToken', () => {
    it('should provide addPaymentToken function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAddPaymentToken());

      expect(typeof result.current.addPaymentToken).toBe('function');
    });

    it('should call writeContractAsync with token address', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useAddPaymentToken());

      await act(async () => {
        await result.current.addPaymentToken(
          '0xNewToken123456789012345678901234567890' as `0x${string}`
        );
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'addPaymentToken',
          args: ['0xNewToken123456789012345678901234567890'],
        })
      );
    });

    it('should return pending state', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => useAddPaymentToken());

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useRemovePaymentToken', () => {
    it('should provide removePaymentToken function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useRemovePaymentToken());

      expect(typeof result.current.removePaymentToken).toBe('function');
    });

    it('should call writeContractAsync with token address', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useRemovePaymentToken());

      await act(async () => {
        await result.current.removePaymentToken(
          '0xOldToken1234567890123456789012345678901' as `0x${string}`
        );
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'removePaymentToken',
          args: ['0xOldToken1234567890123456789012345678901'],
        })
      );
    });
  });

  describe('usePauseDistributor', () => {
    it('should provide pause function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => usePauseDistributor());

      expect(typeof result.current.pause).toBe('function');
    });

    it('should call writeContractAsync for pause', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => usePauseDistributor());

      await act(async () => {
        await result.current.pause();
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'pause',
        })
      );
    });

    it('should return pending state when pausing', () => {
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: jest.fn(),
        isPending: true,
      });

      const { result } = renderHook(() => usePauseDistributor());

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useUnpauseDistributor', () => {
    it('should provide unpause function', () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useUnpauseDistributor());

      expect(typeof result.current.unpause).toBe('function');
    });

    it('should call writeContractAsync for unpause', async () => {
      const mockWriteContractAsync = jest.fn().mockResolvedValue('0xtxhash');
      mockUseWriteContract.mockReturnValue({
        writeContractAsync: mockWriteContractAsync,
        isPending: false,
      });

      const { result } = renderHook(() => useUnpauseDistributor());

      await act(async () => {
        await result.current.unpause();
      });

      expect(mockWriteContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'unpause',
        })
      );
    });
  });

  describe('useIsPaused', () => {
    it('should return paused status from contract', () => {
      mockUseReadContract.mockReturnValue({
        data: true,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useIsPaused());

      expect(result.current.data).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return unpaused status', () => {
      mockUseReadContract.mockReturnValue({
        data: false,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useIsPaused());

      expect(result.current.data).toBe(false);
    });

    it('should return loading state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      const { result } = renderHook(() => useIsPaused());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should return error state', () => {
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      });

      const { result } = renderHook(() => useIsPaused());

      expect(result.current.isError).toBe(true);
    });
  });
});
