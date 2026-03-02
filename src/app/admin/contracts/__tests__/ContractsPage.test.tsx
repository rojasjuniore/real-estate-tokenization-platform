import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminContractsPage from '../page';

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

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_CHAIN_ID: '137',
    NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS: '0xC8a72f1ACDE55c7192e7c5F0b7FF48fce18d7D30',
    NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS: '0xD4a82f2BCEF66c8293e8d6F1c8FF49gce29e8E41',
    NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS: '0xE5b93g3CDFG77d9394f9e7G2d9GG50hdf3af9F52',
    NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS: '0xF6c04h4DEGH88e0405g0f8H3e0HH61ieg4bg0G63',
    NEXT_PUBLIC_USDT_ADDRESS: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    NEXT_PUBLIC_USDC_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('AdminContractsPage', () => {
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

      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login?redirect=/admin/contracts');
      });
    });

    it('should redirect to home if not admin', async () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xNotAdmin',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      render(<AdminContractsPage />);

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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });

      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('Smart Contracts')).toBeInTheDocument();
      });
    });
  });

  describe('Contracts Display', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display list of contracts', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('PropertyToken')).toBeInTheDocument();
      });

      expect(screen.getByText('PropertyMarketplace')).toBeInTheDocument();
      expect(screen.getByText('RoyaltyDistributor')).toBeInTheDocument();
      expect(screen.getByText('PaymentProcessor')).toBeInTheDocument();
    });

    it('should show network name', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        const networkLabels = screen.getAllByText('Polygon Mainnet');
        expect(networkLabels.length).toBeGreaterThan(0);
      });
    });

    it('should show deployed status', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        const deployedBadges = screen.getAllByText('Desplegado');
        expect(deployedBadges.length).toBeGreaterThan(0);
      });
    });

    it('should have tabs for contracts, tokens, and config', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Contratos \(\d+\)/ })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Tokens \(\d+\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configuración' })).toBeInTheDocument();
    });
  });

  describe('Token Tab', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display tokens when tokens tab is clicked', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('Smart Contracts')).toBeInTheDocument();
      });

      const tokensTab = screen.getByRole('button', { name: /Tokens \(\d+\)/ });
      fireEvent.click(tokensTab);

      await waitFor(() => {
        expect(screen.getAllByText('USDT').length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('USDC').length).toBeGreaterThan(0);
    });
  });

  describe('Config Tab', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should display environment variables in config tab', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('Smart Contracts')).toBeInTheDocument();
      });

      const configTab = screen.getByText('Configuración');
      fireEvent.click(configTab);

      await waitFor(() => {
        expect(screen.getByText('Variables de Entorno')).toBeInTheDocument();
      });

      expect(screen.getByText('NEXT_PUBLIC_CHAIN_ID')).toBeInTheDocument();
    });
  });

  describe('Contract Actions', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should have explorer buttons', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        const explorerButtons = screen.getAllByText('Ver en Explorer');
        expect(explorerButtons.length).toBeGreaterThan(0);
      });
    });

    it('should open explorer when button clicked', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('PropertyToken')).toBeInTheDocument();
      });

      const explorerButtons = screen.getAllByText('Ver en Explorer');
      fireEvent.click(explorerButtons[0]);

      expect(mockOpen).toHaveBeenCalled();
    });

    it('should have interact with contracts button', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('Interactuar con Contratos')).toBeInTheDocument();
      });
    });

    it('should navigate to interact page when clicked', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('Interactuar con Contratos')).toBeInTheDocument();
      });

      const interactButton = screen.getByText('Interactuar con Contratos');
      fireEvent.click(interactButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/contracts/interact');
    });
  });

  describe('Contract Details Modal', () => {
    beforeEach(() => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isAdmin: true } }),
      });
    });

    it('should open modal when details button clicked', async () => {
      render(<AdminContractsPage />);

      await waitFor(() => {
        expect(screen.getByText('PropertyToken')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText('Detalles');
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Descripción')).toBeInTheDocument();
      });

      expect(screen.getByText('Dirección del Contrato')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner during auth check', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: false,
        address: null,
        isLoading: true,
      });

      render(<AdminContractsPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });

    it('should show loading during admin check', () => {
      mockUseWeb3Auth.mockReturnValue({
        isConnected: true,
        address: '0xAdminWallet',
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdminContractsPage />);

      expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    });
  });
});
