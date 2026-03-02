import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { isAdmin } from '@/lib/auth/admin';

const RPC_URL = process.env.BACKEND_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

const PAYMENT_TOKENS: Record<string, { address: string; decimals: number; symbol: string }> = {
  USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, symbol: 'USDT' },
  USDC: { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', decimals: 6, symbol: 'USDC' },
};

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
];

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Distribution wallet not configured' } },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const distributionAddress = wallet.address;

    // Get POL (MATIC) balance for gas
    const polBalance = await provider.getBalance(distributionAddress);
    const polFormatted = ethers.formatEther(polBalance);

    // Get token balances
    const tokenBalances: Record<string, { balance: string; formatted: string }> = {};

    for (const [symbol, config] of Object.entries(PAYMENT_TOKENS)) {
      const tokenContract = new ethers.Contract(config.address, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(distributionAddress);
      tokenBalances[symbol] = {
        balance: balance.toString(),
        formatted: ethers.formatUnits(balance, config.decimals),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        address: distributionAddress,
        pol: {
          balance: polBalance.toString(),
          formatted: polFormatted,
        },
        tokens: tokenBalances,
      },
    });
  } catch (error) {
    console.error('[Distribution Wallet] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'WALLET_ERROR', message: 'Error fetching wallet balances' } },
      { status: 500 }
    );
  }
}
