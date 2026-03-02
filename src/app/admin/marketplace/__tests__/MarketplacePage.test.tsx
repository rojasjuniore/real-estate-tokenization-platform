import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminMarketplacePage from '../page';

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

describe('AdminMarketplacePage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockListings = [
    {
      id: 'listing-1',
      property: { id: 'prop-1', name: 'Torre Miami Beach', tokenId: 1 },
      seller: { id: 'user-1', walletAddress: '0x1234567890abcdef1234567890abcdef12345678', name: 'John Doe' },
      fractionCount: 10,
      pricePerFraction: 1000,
      status: 'ACTIVE',
      createdAt: '2024-03-15T10:00:00Z',
    },
    {
      id: 'listing-2',
      property: { id: 'prop-2', name: 'Penthouse Brickell', tokenId: 2 },
      seller: { id: 'user-2', walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Jane Smith' },
      fractionCount: 5,
      pricePerFraction: 2000,
      status: 'ACTIVE',
      createdAt: '2024-03-14T10:00:00Z',
    },
    {
      id: 'listing-3',
      property: { id: 'prop-1', name: 'Torre Miami Beach', tokenId: 1 },
      seller: { id: 'user-3', walletAddress: '0x9876543210fedcba9876543210fedcba98765432', name: 'Bob Wilson' },
      fractionCount: 20,
      pricePerFraction: 950,
      status: 'CANCELLED',
      createdAt: '2024-03-10T10:00:00Z',
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

      render(<AdminMarketplacePage />);

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
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('Marketplace')).toBeInTheDocument();
      });
    });
  });

  describe('Listings Display', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display list of listings', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        const torreMiami = screen.getAllByText('Torre Miami Beach');
        expect(torreMiami.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Penthouse Brickell')).toBeInTheDocument();
    });

    it('should show seller name', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should show fraction count and price', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
      });

      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('should show status badges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        const activeBadges = screen.getAllByText('ACTIVE');
        expect(activeBadges.length).toBe(2);
      });

      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
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
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('Todas')).toBeInTheDocument();
      });

      expect(screen.getByText('Activas')).toBeInTheDocument();
      expect(screen.getByText('Canceladas')).toBeInTheDocument();
    });

    it('should filter listings by status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('Activas')).toBeInTheDocument();
      });

      const activasButton = screen.getByText('Activas');
      fireEvent.click(activasButton);

      // Should only show 2 active listings (filtered on client side)
      await waitFor(() => {
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Admin Actions', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show cancel button for active listings', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        const cancelButtons = screen.getAllByText('Cancelar');
        expect(cancelButtons.length).toBe(2);
      });
    });

    it('should call cancel API when button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { ...mockListings[0], status: 'CANCELLED' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText('Cancelar');
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/marketplace/listing-1/cancel',
          expect.objectContaining({
            method: 'POST',
          })
        );
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

    it('should show marketplace statistics', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockListings }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total listings
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

    it('should show empty state when no listings exist', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });

      render(<AdminMarketplacePage />);

      await waitFor(() => {
        const emptyMessages = screen.getAllByText(/No hay listados/i);
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

      render(<AdminMarketplacePage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });
});
