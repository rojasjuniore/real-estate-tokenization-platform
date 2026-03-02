import { createConfig, http } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Primary chain is Polygon Mainnet
export const CHAIN_CONFIG = {
  chain: polygon,
  chainId: polygon.id,
  name: 'Polygon',
  blockExplorerUrl: 'https://polygonscan.com',
};

export const config = createConfig({
  chains: [polygon],
  connectors: [
    injected(),
  ],
  transports: {
    [polygon.id]: http(),
  },
  ssr: true,
});

export const getConfig = () => config;

// Contract addresses on Polygon Mainnet
export const CONTRACT_ADDRESSES = {
  propertyToken: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS as `0x${string}`,
  marketplace: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS as `0x${string}`,
  royaltyDistributor: process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS as `0x${string}`,
} as const;

// Payment tokens on Polygon Mainnet
export const PAYMENT_TOKENS = {
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
  USDC: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' as `0x${string}`,
  MATIC: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;
