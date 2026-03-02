import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../page';

// Mock the hooks
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

describe('AdminDashboard', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/admin');
      });
    });

    it('should show unauthorized message if not admin', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xNotAdmin',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 403,
        json: () => Promise.resolve({ success: false }),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sin Autorización')).toBeInTheDocument();
      });
    });

    it('should show dashboard if admin is authenticated', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalUsers: 156,
            totalProperties: 12,
            pendingKyc: 3,
            tvl: 2500000,
          },
        }),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Metrics', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display TVL metric', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalUsers: 156,
            totalProperties: 12,
            pendingKyc: 3,
            tvl: 2500000,
          },
        }),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/\$2,500,000/)).toBeInTheDocument();
      });
    });

    it('should display total users count', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalUsers: 156,
            totalProperties: 12,
            pendingKyc: 3,
            tvl: 2500000,
          },
        }),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument();
      });
    });

    it('should display pending KYC count', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalUsers: 156,
            totalProperties: 12,
            pendingKyc: 3,
            tvl: 2500000,
          },
        }),
      });

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking auth', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: true,
      });

      render(<AdminDashboard />);

      expect(screen.getByText(/Verificando acceso/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show unauthorized message when API fails', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sin Autorización')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
