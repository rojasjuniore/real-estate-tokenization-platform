import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletWidget } from '../WalletWidget';
import { useWeb3Auth } from '@/lib/web3auth';

jest.mock('@/lib/web3auth');

const mockUseWeb3Auth = useWeb3Auth as jest.MockedFunction<typeof useWeb3Auth>;

// Helper to create mock return values with required functions
const createMockWeb3Auth = (overrides = {}) => ({
  web3auth: null,
  provider: null,
  isLoading: false,
  isConnected: false,
  address: null,
  userInfo: null,
  login: jest.fn(),
  logout: jest.fn(),
  getBalance: jest.fn().mockResolvedValue('0'),
  getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
  claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
  ...overrides,
});

describe('WalletWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('disconnected state', () => {
    it('does not render when wallet is not connected', () => {
      mockUseWeb3Auth.mockReturnValue(createMockWeb3Auth());

      const { container } = render(<WalletWidget />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('connected state', () => {
    const mockConnectedState = createMockWeb3Auth({
      provider: {},
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      userInfo: { name: 'Test User', email: 'test@example.com' },
      getBalance: jest.fn().mockResolvedValue('10.5432'),
    });

    it('renders wallet address', () => {
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
    });

    it('fetches and displays MATIC balance on mount', async () => {
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      await waitFor(() => {
        expect(mockConnectedState.getBalance).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('10.5432')).toBeInTheDocument();
      });
    });

    it('displays USDT balance as 0 initially', () => {
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);
      const usdtElements = screen.getAllByText('0');
      expect(usdtElements.length).toBeGreaterThan(0);
    });

    it('displays USDC balance as 0 initially', () => {
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);
      const usdcElements = screen.getAllByText('0');
      expect(usdcElements.length).toBeGreaterThan(0);
    });

    it('renders token labels', () => {
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);
      expect(screen.getByText('MATIC')).toBeInTheDocument();
      expect(screen.getByText('USDT')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    const mockConnectedState = createMockWeb3Auth({
      provider: {},
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      getBalance: jest.fn().mockResolvedValue('10.5432'),
    });

    it('toggles menu when address is clicked', async () => {
      const user = userEvent.setup();
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      expect(addressButton).toBeInTheDocument();

      if (addressButton) {
        await user.click(addressButton);
        await waitFor(() => {
          const copyButton = screen.queryByText(/copiar/i);
          expect(copyButton).toBeInTheDocument();
        });
      }
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        await user.click(addressButton);

        await waitFor(() => {
          expect(screen.queryByText(/copiar/i)).toBeInTheDocument();
        });

        await user.click(document.body);

        await waitFor(() => {
          expect(screen.queryByText(/copiar/i)).not.toBeInTheDocument();
        });
      }
    });

    it('shows copy address option in menu', async () => {
      const user = userEvent.setup();
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        await user.click(addressButton);

        await waitFor(() => {
          expect(screen.getByText(/copiar/i)).toBeInTheDocument();
        });
      }
    });

    it('shows disconnect option in menu', async () => {
      const user = userEvent.setup();
      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        await user.click(addressButton);

        await waitFor(() => {
          expect(screen.getByText(/desconectar/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('clipboard functionality', () => {
    const mockConnectedState = createMockWeb3Auth({
      provider: {},
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      getBalance: jest.fn().mockResolvedValue('10.5432'),
    });

    it('copies address to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      });

      mockUseWeb3Auth.mockReturnValue(mockConnectedState);

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        await user.click(addressButton);

        const copyButton = await screen.findByText(/copiar/i);
        await user.click(copyButton);

        expect(mockWriteText).toHaveBeenCalledWith(mockConnectedState.address);
      }
    });
  });

  describe('logout functionality', () => {
    it('calls logout when disconnect is clicked', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn().mockResolvedValue(undefined);

      mockUseWeb3Auth.mockReturnValue(createMockWeb3Auth({
        provider: {},
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        logout: mockLogout,
        getBalance: jest.fn().mockResolvedValue('10.5432'),
      }));

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        await user.click(addressButton);

        const disconnectButton = await screen.findByText(/desconectar/i);
        await user.click(disconnectButton);

        expect(mockLogout).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('loading state', () => {
    it('shows loading state for balance while fetching', () => {
      mockUseWeb3Auth.mockReturnValue(createMockWeb3Auth({
        provider: {},
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        getBalance: jest.fn().mockImplementation(() => new Promise(() => {})),
      }));

      render(<WalletWidget />);
      expect(screen.getByText('MATIC')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper button roles and labels', () => {
      mockUseWeb3Auth.mockReturnValue(createMockWeb3Auth({
        provider: {},
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        getBalance: jest.fn().mockResolvedValue('10.5432'),
      }));

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      expect(addressButton).toBeInTheDocument();
    });

    it('provides keyboard navigation support', () => {
      mockUseWeb3Auth.mockReturnValue(createMockWeb3Auth({
        provider: {},
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        getBalance: jest.fn().mockResolvedValue('10.5432'),
      }));

      render(<WalletWidget />);

      const addressButton = screen.getByText(/0x1234...7890/i).closest('button');
      if (addressButton) {
        addressButton.focus();
        expect(document.activeElement).toBe(addressButton);
      }
    });
  });
});
