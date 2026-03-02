import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^wagmi$': '<rootDir>/src/__mocks__/wagmi.ts',
    '^wagmi/chains$': '<rootDir>/src/__mocks__/wagmi/chains.ts',
    '^wagmi/connectors$': '<rootDir>/src/__mocks__/wagmi/connectors.ts',
    '^viem$': '<rootDir>/src/__mocks__/viem.ts',
    '^viem/chains$': '<rootDir>/src/__mocks__/wagmi/chains.ts',
    '^@tanstack/react-query$': '<rootDir>/src/__mocks__/react-query.ts',
    '^@web3auth/modal$': '<rootDir>/src/__mocks__/@web3auth/modal.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/test/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/__mocks__/**',
    '!src/lib/web3/config.ts',
    '!src/lib/web3/providers.tsx',
    '!src/lib/web3/abis/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

export default createJestConfig(config);
