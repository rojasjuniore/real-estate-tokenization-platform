import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDividendsPage from '../page';

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

describe('AdminDividendsPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockDividends = [
    {
      id: 'div-1',
      property: { id: 'prop-1', name: 'Casa del Sol', tokenId: 1 },
      totalAmount: 10000,
      amountPerToken: 10,
      paymentToken: 'USDT',
      period: '2024-Q1',
      status: 'DISTRIBUTED',
      distributedAt: '2024-03-31T00:00:00Z',
      stats: {
        totalHolders: 50,
        claimedCount: 35,
        claimedAmount: 3500,
        claimPercentage: 70,
      },
    },
    {
      id: 'div-2',
      property: { id: 'prop-2', name: 'Torre Comercial', tokenId: 2 },
      totalAmount: 5000,
      amountPerToken: 5,
      paymentToken: 'USDC',
      period: '2024-Q1',
      status: 'PENDING',
      stats: {
        totalHolders: 100,
        claimedCount: 0,
        claimedAmount: 0,
        claimPercentage: 0,
      },
    },
  ];

  const mockProperties = [
    { id: 'prop-1', name: 'Casa del Sol', tokenId: 1 },
    { id: 'prop-2', name: 'Torre Comercial', tokenId: 2 },
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

      render(<AdminDividendsPage />);

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
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('Distribuciones')).toBeInTheDocument();
      });
    });
  });

  describe('Dividends List', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display list of dividends', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('Casa del Sol')).toBeInTheDocument();
      });

      expect(screen.getByText('Torre Comercial')).toBeInTheDocument();
    });

    it('should show dividend amount', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText(/10,000/)).toBeInTheDocument();
      });
    });

    it('should show status badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('DISTRIBUTED')).toBeInTheDocument();
      });

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('should show claim statistics', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        // Format: "35 / 50" with claim percentage
        expect(screen.getByText('35 / 50')).toBeInTheDocument();
      });
    });
  });

  describe('Create Distribution', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should have button to create new distribution', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Distribución')).toBeInTheDocument();
      });
    });

    it('should show create form when button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Distribución')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nueva Distribución'));

      await waitFor(() => {
        expect(screen.getByText('Crear Distribución')).toBeInTheDocument();
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

    it('should show empty state when no dividends exist', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No hay distribuciones/i)).toBeInTheDocument();
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

      render(<AdminDividendsPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show error message when API fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockRejectedValueOnce(new Error('API Error'));

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Distribute Action', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show distribute button for pending dividends', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDividends }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { properties: mockProperties } }),
        });

      render(<AdminDividendsPage />);

      await waitFor(() => {
        expect(screen.getByText('Distribuir')).toBeInTheDocument();
      });
    });
  });
});
