import { renderHook, waitFor, act } from '@testing-library/react';
import { useKYC } from '../useKYC';

// Mock useWeb3Auth
const mockUseWeb3Auth = jest.fn();
jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useKYC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('initial state', () => {
    it('should return loading state initially when connected', () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useKYC());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toBe('NONE');
      expect(result.current.error).toBeNull();
    });

    it('should not be loading when not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: null });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('fetchStatus', () => {
    it('should fetch KYC status when connected', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              kycStatus: 'APPROVED',
              submission: {
                id: 'kyc-1',
                status: 'APPROVED',
                adminNotes: null,
                createdAt: '2024-01-01',
                reviewedAt: '2024-01-02',
              },
            },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('APPROVED');
      expect(result.current.submission).not.toBeNull();
      expect(result.current.isApproved).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/kyc/status', {
        headers: { 'x-wallet-address': '0x123' },
      });
    });

    it('should handle pending status', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              kycStatus: 'PENDING',
              submission: { id: 'kyc-1', status: 'PENDING' },
            },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('PENDING');
      expect(result.current.isPending).toBe(true);
      expect(result.current.isApproved).toBe(false);
    });

    it('should handle rejected status', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              kycStatus: 'REJECTED',
              submission: { id: 'kyc-1', status: 'REJECTED', adminNotes: 'Invalid documents' },
            },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('REJECTED');
      expect(result.current.isRejected).toBe(true);
      expect(result.current.submission?.adminNotes).toBe('Invalid documents');
    });

    it('should handle NONE status (needs KYC)', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              kycStatus: 'NONE',
              submission: null,
            },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toBe('NONE');
      expect(result.current.needsKYC).toBe(true);
    });

    it('should handle API error response', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'User not found' },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('User not found');
      expect(result.current.hasFetched).toBe(true);
    });

    it('should handle fetch error', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should not fetch if no address', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: null });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('uploadDocument', () => {
    it('should upload document and return URL', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'NONE', submission: null },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { url: 'https://storage.example.com/doc.jpg' },
            }),
        });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      let uploadedUrl: string;

      await act(async () => {
        uploadedUrl = await result.current.uploadDocument(file, 'idFront');
      });

      expect(uploadedUrl!).toBe('https://storage.example.com/doc.jpg');
      expect(mockFetch).toHaveBeenLastCalledWith('/api/kyc/upload', {
        method: 'POST',
        headers: { 'x-wallet-address': '0x123' },
        body: expect.any(FormData),
      });
    });

    it('should throw error when not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: null });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(result.current.uploadDocument(file, 'idFront')).rejects.toThrow(
        'Wallet not connected'
      );
    });

    it('should throw error on upload failure', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'NONE', submission: null },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: false,
              error: { message: 'File too large' },
            }),
        });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(result.current.uploadDocument(file, 'idFront')).rejects.toThrow(
        'File too large'
      );
    });
  });

  describe('submitKYC', () => {
    it('should submit KYC documents', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      const submittedKYC = {
        id: 'kyc-new',
        status: 'PENDING',
        adminNotes: null,
        createdAt: '2024-01-01',
        reviewedAt: null,
      };

      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'NONE', submission: null },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: submittedKYC,
            }),
        });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const documents = {
        name: 'Test User',
        email: 'test@example.com',
        idFrontUrl: 'https://example.com/front.jpg',
        idBackUrl: 'https://example.com/back.jpg',
        selfieUrl: 'https://example.com/selfie.jpg',
      };

      await act(async () => {
        await result.current.submitKYC(documents);
      });

      expect(result.current.status).toBe('PENDING');
      expect(result.current.submission).toEqual(submittedKYC);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': '0x123',
        },
        body: JSON.stringify(documents),
      });
    });

    it('should throw error when not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: null });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.submitKYC({
          name: 'Test User',
          email: 'test@example.com',
          idFrontUrl: 'url1',
          idBackUrl: 'url2',
          selfieUrl: 'url3',
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('should handle submission failure', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'NONE', submission: null },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: false,
              error: { message: 'KYC already submitted' },
            }),
        });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.submitKYC({
          name: 'Test User',
          email: 'test@example.com',
          idFrontUrl: 'url1',
          idBackUrl: 'url2',
          selfieUrl: 'url3',
        })
      ).rejects.toThrow('KYC already submitted');

      await waitFor(() => {
        expect(result.current.error).toBe('KYC already submitted');
      });
    });
  });

  describe('computed properties', () => {
    it('should return correct computed values for APPROVED status', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { kycStatus: 'APPROVED', submission: { id: 'kyc-1', status: 'APPROVED' } },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isApproved).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.needsKYC).toBe(false);
    });

    it('should return correct computed values for NONE status', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { kycStatus: 'NONE', submission: null },
          }),
      });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isApproved).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isRejected).toBe(false);
      expect(result.current.needsKYC).toBe(true);
    });
  });

  describe('refetch', () => {
    it('should allow manual refetch of status', async () => {
      mockUseWeb3Auth.mockReturnValue({ address: '0x123' });
      mockFetch
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'PENDING', submission: { id: 'kyc-1', status: 'PENDING' } },
            }),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              success: true,
              data: { kycStatus: 'APPROVED', submission: { id: 'kyc-1', status: 'APPROVED' } },
            }),
        });

      const { result } = renderHook(() => useKYC());

      await waitFor(() => {
        expect(result.current.status).toBe('PENDING');
      });

      await act(async () => {
        await result.current.fetchStatus();
      });

      expect(result.current.status).toBe('APPROVED');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
