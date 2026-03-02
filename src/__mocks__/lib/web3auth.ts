// Mock for web3auth hooks and context
export const useWeb3Auth = jest.fn(() => ({
  web3auth: null,
  provider: null,
  isLoading: false,
  isConnected: false,
  address: null,
  userInfo: null,
  login: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn().mockResolvedValue(undefined),
  getBalance: jest.fn().mockResolvedValue('0'),
  getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
  claimRoyalty: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  purchaseTokens: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  approveTokensForDistributor: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  createDistribution: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  getDistributionInfo: jest.fn().mockResolvedValue(null),
  getClaimableAmount: jest.fn().mockResolvedValue(null),
  buyFromMarketplace: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  approveMarketplace: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  isMarketplaceApproved: jest.fn().mockResolvedValue(false),
  createMarketplaceListing: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  cancelMarketplaceListing: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
}));

export const Web3AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

// Default mock values
const defaultMockValues = {
  web3auth: null,
  provider: null,
  isLoading: false,
  isConnected: false,
  address: null,
  userInfo: null,
  login: jest.fn().mockResolvedValue({ success: true }),
  logout: jest.fn().mockResolvedValue(undefined),
  getBalance: jest.fn().mockResolvedValue('0'),
  getBalances: jest.fn().mockResolvedValue({ matic: '0', usdt: '0' }),
  claimRoyalty: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  purchaseTokens: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  approveTokensForDistributor: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  createDistribution: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  getDistributionInfo: jest.fn().mockResolvedValue(null),
  getClaimableAmount: jest.fn().mockResolvedValue(null),
  buyFromMarketplace: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  approveMarketplace: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  isMarketplaceApproved: jest.fn().mockResolvedValue(false),
  createMarketplaceListing: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
  cancelMarketplaceListing: jest.fn().mockResolvedValue({ success: false, error: 'Not initialized' }),
};

// Helper to set mock values
export const mockUseWeb3Auth = (overrides: Partial<typeof defaultMockValues>) => {
  (useWeb3Auth as jest.Mock).mockReturnValue({
    ...defaultMockValues,
    ...overrides,
  });
};

export const CHAIN_CONFIG = {};
export const WEB3AUTH_CLIENT_ID = 'mock-client-id';
