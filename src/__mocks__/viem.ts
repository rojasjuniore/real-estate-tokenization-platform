export const createPublicClient = jest.fn(() => ({
  readContract: jest.fn(),
  getBalance: jest.fn(),
}));

export const createWalletClient = jest.fn(() => ({
  writeContract: jest.fn(),
}));

export const http = jest.fn();
export const webSocket = jest.fn();

export const formatEther = jest.fn((value: bigint) => (Number(value) / 1e18).toString());
export const parseEther = jest.fn((value: string) => BigInt(Math.floor(parseFloat(value) * 1e18)));
export const formatUnits = jest.fn((value: bigint, decimals: number) =>
  (Number(value) / Math.pow(10, decimals)).toString()
);
export const parseUnits = jest.fn((value: string, decimals: number) =>
  BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)))
);

export const getAddress = jest.fn((address: string) => address);
export const isAddress = jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address));

export const zeroAddress = '0x0000000000000000000000000000000000000000';
