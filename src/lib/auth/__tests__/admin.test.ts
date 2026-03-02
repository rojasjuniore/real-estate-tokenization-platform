import { isAdmin, invalidateAdminCache, clearAdminCache } from '../admin';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Contract: jest.fn().mockImplementation(() => ({
      hasRole: jest.fn(),
    })),
    keccak256: jest.fn().mockReturnValue('0xmockedAdminRoleHash'),
    toUtf8Bytes: jest.fn().mockReturnValue(new Uint8Array()),
    isAddress: jest.fn().mockImplementation((addr) => addr?.startsWith('0x') && addr.length === 42),
  },
}));

describe('isAdmin (on-chain verification with cache)', () => {
  const validAddress = '0x1234567890123456789012345678901234567890';
  const invalidAddress = 'not-an-address';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    clearAdminCache();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS: '0xContractAddress1234567890123456789012'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns false for invalid address format', async () => {
    const result = await isAdmin(invalidAddress);
    expect(result).toBe(false);
  });

  it('returns false when walletAddress is undefined', async () => {
    const result = await isAdmin(undefined);
    expect(result).toBe(false);
  });

  it('returns false when walletAddress is empty', async () => {
    const result = await isAdmin('');
    expect(result).toBe(false);
  });

  it('returns false when contract address is not configured', async () => {
    delete process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await isAdmin(validAddress);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('[isAdmin] PropertyToken address not configured');
    consoleSpy.mockRestore();
  });

  it('returns true when wallet has ADMIN_ROLE', async () => {
    const { ethers } = require('ethers');
    const mockHasRole = jest.fn().mockResolvedValue(true);
    ethers.Contract.mockImplementation(() => ({
      hasRole: mockHasRole,
    }));

    const result = await isAdmin(validAddress);
    expect(result).toBe(true);
  });

  it('returns false when wallet does not have ADMIN_ROLE or DEFAULT_ADMIN_ROLE', async () => {
    const { ethers } = require('ethers');
    const mockHasRole = jest.fn().mockResolvedValue(false);
    ethers.Contract.mockImplementation(() => ({
      hasRole: mockHasRole,
    }));

    const result = await isAdmin(validAddress);
    expect(result).toBe(false);
  });

  it('returns true when wallet has DEFAULT_ADMIN_ROLE but not ADMIN_ROLE', async () => {
    const { ethers } = require('ethers');
    const mockHasRole = jest.fn()
      .mockResolvedValueOnce(false)  // ADMIN_ROLE check
      .mockResolvedValueOnce(true);  // DEFAULT_ADMIN_ROLE check
    ethers.Contract.mockImplementation(() => ({
      hasRole: mockHasRole,
    }));

    const result = await isAdmin(validAddress);
    expect(result).toBe(true);
  });

  it('returns false and logs error on RPC failure', async () => {
    const { ethers } = require('ethers');
    const mockHasRole = jest.fn().mockRejectedValue(new Error('RPC error'));
    ethers.Contract.mockImplementation(() => ({
      hasRole: mockHasRole,
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await isAdmin(validAddress);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  describe('caching behavior', () => {
    it('returns cached result on second call without hitting RPC', async () => {
      const { ethers } = require('ethers');
      const mockHasRole = jest.fn().mockResolvedValue(true);
      ethers.Contract.mockImplementation(() => ({
        hasRole: mockHasRole,
      }));

      // First call - hits RPC
      const result1 = await isAdmin(validAddress);
      expect(result1).toBe(true);
      expect(mockHasRole).toHaveBeenCalledTimes(2); // ADMIN_ROLE + DEFAULT_ADMIN_ROLE

      // Second call - should use cache
      const result2 = await isAdmin(validAddress);
      expect(result2).toBe(true);
      expect(mockHasRole).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('invalidateAdminCache clears cache for specific address', async () => {
      const { ethers } = require('ethers');
      const mockHasRole = jest.fn().mockResolvedValue(true);
      ethers.Contract.mockImplementation(() => ({
        hasRole: mockHasRole,
      }));

      // First call - hits RPC
      await isAdmin(validAddress);
      expect(mockHasRole).toHaveBeenCalledTimes(2);

      // Invalidate cache
      invalidateAdminCache(validAddress);

      // Third call - should hit RPC again
      await isAdmin(validAddress);
      expect(mockHasRole).toHaveBeenCalledTimes(4);
    });

    it('cache is case-insensitive', async () => {
      const { ethers } = require('ethers');
      const mockHasRole = jest.fn().mockResolvedValue(true);
      ethers.Contract.mockImplementation(() => ({
        hasRole: mockHasRole,
      }));

      // Call with lowercase
      await isAdmin(validAddress.toLowerCase());
      expect(mockHasRole).toHaveBeenCalledTimes(2);

      // Call with uppercase - should use cache
      await isAdmin(validAddress.toUpperCase());
      expect(mockHasRole).toHaveBeenCalledTimes(2);
    });
  });
});
