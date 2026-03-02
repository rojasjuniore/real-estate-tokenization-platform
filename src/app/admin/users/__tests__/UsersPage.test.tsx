import { render, screen, waitFor } from '@testing-library/react';
import AdminUsersPage from '../page';

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

describe('AdminUsersPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockUsers = [
    {
      id: 'user-1',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      email: 'john@test.com',
      name: 'John Doe',
      kycStatus: 'APPROVED',
      role: 'USER',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'user-2',
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      email: 'jane@test.com',
      name: 'Jane Smith',
      kycStatus: 'PENDING',
      role: 'USER',
      createdAt: '2024-02-20T10:00:00Z',
    },
    {
      id: 'user-3',
      walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
      email: 'admin@test.com',
      name: 'Admin User',
      kycStatus: 'APPROVED',
      role: 'ADMIN',
      createdAt: '2024-01-01T10:00:00Z',
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

      render(<AdminUsersPage />);

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
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
      });
    });
  });

  describe('Users List', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display list of users', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('should show user email', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
      });
    });

    it('should show KYC status badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        const approvedBadges = screen.getAllByText('APPROVED');
        expect(approvedBadges.length).toBe(2);
      });

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('should show role badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
      });

      const userBadges = screen.getAllByText('USER');
      expect(userBadges.length).toBe(2);
    });

    it('should show truncated wallet address', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234.*5678/)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show total users count', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
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

    it('should show empty state when no users exist', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        const emptyMessages = screen.getAllByText(/No hay usuarios/i);
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

      render(<AdminUsersPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should have search input', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUsers }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument();
      });
    });
  });
});
