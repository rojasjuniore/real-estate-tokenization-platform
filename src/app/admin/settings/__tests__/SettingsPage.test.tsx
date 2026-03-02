import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminSettingsPage from '../page';

// Mock hooks
const mockUseWeb3Auth = jest.fn();
const mockUseRouter = jest.fn();
const mockUseContractInteraction = jest.fn();

jest.mock('@/lib/web3auth', () => ({
  useWeb3Auth: () => mockUseWeb3Auth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}));

jest.mock('@/lib/contracts/useContractInteraction', () => ({
  useContractInteraction: () => mockUseContractInteraction(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminSettingsPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockSettings = {
    platformName: 'TokenByU',
    platformFee: 2.5,
    minInvestment: 100,
    maxInvestment: 100000,
    kycRequired: true,
    maintenanceMode: false,
    contactEmail: 'admin@tokenbyu.com',
    treasuryWallet: '0x1234567890123456789012345678901234567890',
    acceptedTokens: ['USDT', 'USDC'],
    defaultFractions: 10000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    // Mock contract interaction hooks
    mockUseContractInteraction.mockReturnValue({
      setMarketplaceFee: jest.fn().mockResolvedValue({ success: true }),
      setMarketplaceTreasury: jest.fn().mockResolvedValue({ success: true }),
      addPaymentTokenToMarketplace: jest.fn().mockResolvedValue({ success: true }),
      removePaymentTokenFromMarketplace: jest.fn().mockResolvedValue({ success: true }),
      pauseMarketplace: jest.fn().mockResolvedValue({ success: true }),
      unpauseMarketplace: jest.fn().mockResolvedValue({ success: true }),
      getMarketplaceFee: jest.fn().mockResolvedValue(2.5),
      getMarketplaceTreasury: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      isMarketplacePaused: jest.fn().mockResolvedValue(false),
      isPaymentTokenAccepted: jest.fn().mockResolvedValue(true),
    });
  });

  describe('Authentication', () => {
    it('should redirect to home if not connected', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: false,
      });

      render(<AdminSettingsPage />);

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
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Configuración')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Display', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should display platform name field', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nombre de la Plataforma/i)).toBeInTheDocument();
      });
    });

    it('should display platform fee field', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Comisión de la Plataforma/i)).toBeInTheDocument();
      });
    });

    it('should display min investment field', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Inversión Mínima/i)).toBeInTheDocument();
      });
    });

    it('should display KYC required toggle', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/KYC Requerido/i)).toBeInTheDocument();
      });
    });

    it('should display maintenance mode toggle', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Modo Mantenimiento/i)).toBeInTheDocument();
      });
    });

    it('should load settings values', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        const platformNameInput = screen.getByLabelText(/Nombre de la Plataforma/i) as HTMLInputElement;
        expect(platformNameInput.value).toBe('TokenByU');
      });
    });
  });

  describe('Settings Update', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });
    });

    it('should show save button', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Guardar en BD')).toBeInTheDocument();
      });
    });

    it('should call update API on save', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Guardar en BD')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Guardar en BD');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/settings',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should show success message on save', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSettings }),
        });

      render(<AdminSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Guardar en BD')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Guardar en BD');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/guardada en base de datos/i)).toBeInTheDocument();
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

      render(<AdminSettingsPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });
});
