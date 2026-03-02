import { renderHook, waitFor } from '@testing-library/react';
import { useAdminCheck } from '../useAdminCheck';

// Mock useWeb3Auth
const mockUseWeb3Auth = jest.fn();
jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAdminCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should return isAdmin false when not connected', () => {
    mockUseWeb3Auth.mockReturnValue({
      address: null,
      isConnected: false,
    });

    const { result } = renderHook(() => useAdminCheck());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should check admin status when connected', async () => {
    mockUseWeb3Auth.mockReturnValue({
      address: '0x123',
      isConnected: true,
    });

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
    });

    const { result } = renderHook(() => useAdminCheck());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/check', {
      headers: { 'x-wallet-address': '0x123' },
    });
  });

  it('should return isAdmin false when API returns non-admin', async () => {
    mockUseWeb3Auth.mockReturnValue({
      address: '0x456',
      isConnected: true,
    });

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { isAdmin: false } }),
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should handle API errors', async () => {
    mockUseWeb3Auth.mockReturnValue({
      address: '0x789',
      isConnected: true,
    });

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Unauthorized' }
      }),
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.error).toBe('Unauthorized');
  });

  it('should handle fetch errors', async () => {
    mockUseWeb3Auth.mockReturnValue({
      address: '0xabc',
      isConnected: true,
    });

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.error).toBe('Failed to check admin status');
  });
});
