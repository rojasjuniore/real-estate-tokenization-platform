import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectButton } from '../ConnectButton';
import { useWeb3Auth } from '@/lib/web3auth';

jest.mock('@/lib/web3auth');

const mockUseWeb3Auth = useWeb3Auth as jest.MockedFunction<typeof useWeb3Auth>;

describe('ConnectButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('disconnected state', () => {
    it('renders connect button when wallet is not connected', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: false,
        isConnected: false,
        address: null,
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      expect(screen.getByRole('button', { name: /conectar/i })).toBeInTheDocument();
    });

    it('calls login when connect button is clicked', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(true);

      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: false,
        isConnected: false,
        address: null,
        userInfo: null,
        login: mockLogin,
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      await user.click(screen.getByRole('button', { name: /conectar/i }));

      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('connected state', () => {
    it('renders disconnect button when wallet is connected', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: {},
        isLoading: false,
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
    });

    it('displays formatted wallet address', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: {},
        isLoading: false,
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
    });

    it('calls logout when disconnect button is clicked', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn().mockResolvedValue(undefined);

      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: {},
        isLoading: false,
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        userInfo: null,
        login: jest.fn(),
        logout: mockLogout,
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      await user.click(screen.getByRole('button', { name: /desconectar/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('renders loading state with disabled button', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: true,
        isConnected: false,
        address: null,
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows loading indicator when isLoading is true', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: true,
        isConnected: false,
        address: null,
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('handles login failure gracefully', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(false);

      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: false,
        isConnected: false,
        address: null,
        userInfo: null,
        login: mockLogin,
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      await user.click(screen.getByRole('button', { name: /conectar/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('handles logout errors without crashing', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn().mockRejectedValue(new Error('Logout failed'));

      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: {},
        isLoading: false,
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        userInfo: null,
        login: jest.fn(),
        logout: mockLogout,
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      await user.click(screen.getByRole('button', { name: /desconectar/i }));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('has accessible button label when disconnected', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: null,
        isLoading: false,
        isConnected: false,
        address: null,
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      const button = screen.getByRole('button', { name: /conectar/i });
      expect(button).toBeInTheDocument();
    });

    it('has accessible button label when connected', () => {
      mockUseWeb3Auth.mockReturnValue({
        web3auth: null,
        provider: {},
        isLoading: false,
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        userInfo: null,
        login: jest.fn(),
        logout: jest.fn(),
        getBalance: jest.fn(),
        getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
        claimRoyalty: jest.fn().mockResolvedValue({ success: false }),
      });

      render(<ConnectButton />);
      const button = screen.getByRole('button', { name: /desconectar/i });
      expect(button).toBeInTheDocument();
    });
  });
});
