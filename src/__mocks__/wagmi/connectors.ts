export const injected = jest.fn(() => ({
  id: 'injected',
  name: 'Injected',
  type: 'injected',
}));

export const walletConnect = jest.fn(() => ({
  id: 'walletConnect',
  name: 'WalletConnect',
  type: 'walletConnect',
}));

export const coinbaseWallet = jest.fn(() => ({
  id: 'coinbaseWallet',
  name: 'Coinbase Wallet',
  type: 'coinbaseWallet',
}));

export const metaMask = jest.fn(() => ({
  id: 'metaMask',
  name: 'MetaMask',
  type: 'metaMask',
}));
