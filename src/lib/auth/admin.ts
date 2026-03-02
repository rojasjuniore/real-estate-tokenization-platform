import { ethers } from 'ethers';

const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

const ACCESS_CONTROL_ABI = [
  'function hasRole(bytes32 role, address account) view returns (bool)',
];

// Cache configuration
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

/**
 * Get cached admin status if valid
 */
function getCachedAdminStatus(walletAddress: string): boolean | null {
  const cached = adminCache.get(walletAddress.toLowerCase());
  if (cached && Date.now() < cached.expiresAt) {
    return cached.isAdmin;
  }
  return null;
}

/**
 * Set admin status in cache
 */
function setCachedAdminStatus(walletAddress: string, isAdmin: boolean): void {
  adminCache.set(walletAddress.toLowerCase(), {
    isAdmin,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Invalidate cache for a specific wallet (call after granting/revoking roles)
 */
export function invalidateAdminCache(walletAddress: string): void {
  adminCache.delete(walletAddress.toLowerCase());
}

/**
 * Clear entire admin cache
 */
export function clearAdminCache(): void {
  adminCache.clear();
}

/**
 * Check if wallet has ADMIN_ROLE or DEFAULT_ADMIN_ROLE on PropertyToken contract
 * Results are cached for 1 minute to reduce RPC calls
 */
export async function isAdmin(walletAddress: string | undefined): Promise<boolean> {
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return false;
  }

  // Check cache first
  const cached = getCachedAdminStatus(walletAddress);
  if (cached !== null) {
    return cached;
  }

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS;
  if (!contractAddress) {
    console.error('[isAdmin] PropertyToken address not configured');
    return false;
  }

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, ACCESS_CONTROL_ABI, provider);

    const [hasAdminRole, hasDefaultAdminRole] = await Promise.all([
      contract.hasRole(ADMIN_ROLE, walletAddress),
      contract.hasRole(DEFAULT_ADMIN_ROLE, walletAddress),
    ]);

    const result = hasAdminRole || hasDefaultAdminRole;

    // Cache the result
    setCachedAdminStatus(walletAddress, result);

    return result;
  } catch (error) {
    console.error('[isAdmin] Error checking role:', error);
    return false;
  }
}

/**
 * Throws if wallet is not an admin (on-chain verification)
 */
export async function requireAdmin(walletAddress: string | undefined): Promise<void> {
  if (!(await isAdmin(walletAddress))) {
    throw new Error('Unauthorized: Admin access required');
  }
}
