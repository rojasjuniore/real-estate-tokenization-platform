import type { NextConfig } from "next";
import { readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Skip static generation for error pages
  skipTrailingSlashRedirect: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Ignore optional dependencies from wagmi connectors and MetaMask SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      '@base-org/account': false,
      '@gemini-wallet/core': false,
      'porto': false,
      '@safe-global/safe-apps-sdk': false,
      '@safe-global/safe-apps-provider': false,
      '@walletconnect/ethereum-provider': false,
      '@walletconnect/modal': false,
      '@react-native-async-storage/async-storage': false,
    };

    // Ensure web3 packages are not bundled in SSR context
    if (isServer) {
      config.externals = config.externals || [];
      const externals = [
        '@metamask/sdk',
        '@web3auth/base',
        '@web3auth/openlogin-adapter',
        '@web3auth/modal',
      ];
      externals.forEach(pkg => {
        if (Array.isArray(config.externals)) {
          config.externals.push(pkg);
        }
      });
    }

    return config;
  },
};

export default nextConfig;
