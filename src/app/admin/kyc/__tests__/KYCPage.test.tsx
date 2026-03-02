import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminKYCPage from '../page';

// Mock hooks
const mockUseWeb3Auth = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminKYCPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockKYCSubmissions = [
    {
      id: 'kyc-1',
      user: { id: 'user-1', walletAddress: '0x123...', email: 'user1@test.com', name: 'John Doe' },
      documentType: 'PASSPORT',
      documentNumber: 'AB123456',
      status: 'PENDING',
      createdAt: '2024-03-15T10:00:00Z',
    },
    {
      id: 'kyc-2',
      user: { id: 'user-2', walletAddress: '0x456...', email: 'user2@test.com', name: 'Jane Smith' },
      documentType: 'ID_CARD',
      documentNumber: 'CD789012',
      status: 'PENDING',
      createdAt: '2024-03-14T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Authentication', () => {
    it('should redirect to home if not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/#home');
      });
    });

    it('should show page if admin is authenticated', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('Verificación KYC')).toBeInTheDocument();
      });
    });
  });

  describe('KYC List', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display list of KYC submissions', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show user email', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      });
    });

    it('should show document type', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('PASSPORT')).toBeInTheDocument();
      });
    });

    it('should show status badges translated', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        // Status badges are translated (Pendiente, not PENDING)
        const pendingBadges = screen.getAllByText('Pendiente');
        expect(pendingBadges.length).toBe(2);
      });
    });
  });

  describe('KYC Actions', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show approve and reject buttons', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        const approveButtons = screen.getAllByText('Aprobar');
        expect(approveButtons.length).toBe(2);
      });

      const rejectButtons = screen.getAllByText('Rechazar');
      expect(rejectButtons.length).toBe(2);
    });

    it('should call approve API when approve clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { ...mockKYCSubmissions[0], status: 'APPROVED' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText('Aprobar');
      fireEvent.click(approveButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/kyc/kyc-1',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('APPROVED'),
          })
        );
      });
    });
  });

  describe('Status Filter', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should have status filter tabs', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockKYCSubmissions }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
      });

      expect(screen.getByText('Aprobados')).toBeInTheDocument();
      expect(screen.getByText('Rechazados')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show empty state when no KYC submissions', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

      render(<AdminKYCPage />);

      await waitFor(() => {
        const emptyMessages = screen.getAllByText(/No hay solicitudes/i);
        expect(emptyMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner during auth check', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: true,
      });

      render(<AdminKYCPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });
});
