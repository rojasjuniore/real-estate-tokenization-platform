import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';

// Contract addresses from environment
const CONTRACTS_CONFIG = [
  {
    name: 'PropertyToken',
    address: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || '',
    network: 'Polygon Mainnet',
    description: 'ERC-1155 token for property fractions',
  },
  {
    name: 'PropertyMarketplace',
    address: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS || '',
    network: 'Polygon Mainnet',
    description: 'Secondary market for property tokens',
  },
  {
    name: 'RoyaltyDistributor',
    address: process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS || '',
    network: 'Polygon Mainnet',
    description: 'Distributes dividends to token holders',
  },
  {
    name: 'PaymentProcessor',
    address: process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS || '',
    network: 'Polygon Mainnet',
    description: 'Handles USDT/USDC payments',
  },
];

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' }
        },
        { status: 403 }
      );
    }

    // Format contracts for the page's expected structure
    const contracts = CONTRACTS_CONFIG.filter(c => c.address).map((contract) => ({
      name: contract.name,
      address: contract.address,
      network: contract.network,
      isPaused: false, // Would need on-chain check for real status
      totalTransactions: 0, // Would need blockchain query
      lastTransaction: new Date().toISOString(), // Placeholder
    }));

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Contracts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONTRACTS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
