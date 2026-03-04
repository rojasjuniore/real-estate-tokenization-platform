import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import { isAdmin, invalidateAdminCache } from '@/lib/auth/admin';

const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

const ACCESS_CONTROL_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
];

const CONTRACTS = [
  {
    name: 'PropertyToken',
    address: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS,
  },
  {
    name: 'PropertyMarketplace',
    address: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS,
  },
];

// GET - Check roles for an address
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const addressToCheck = searchParams.get('address');

    if (!addressToCheck || !ethers.isAddress(addressToCheck)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid address required' } },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.BACKEND_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'RPC URL not configured' } },
        { status: 500 }
      );
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const results = [];

    for (const contractInfo of CONTRACTS) {
      if (!contractInfo.address) continue;

      try {
        const contract = new ethers.Contract(contractInfo.address, ACCESS_CONTROL_ABI, provider);
        const hasAdminRole = await contract.hasRole(ADMIN_ROLE, addressToCheck);
        const hasDefaultAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, addressToCheck);

        results.push({
          contract: contractInfo.name,
          address: contractInfo.address,
          hasAdminRole,
          hasDefaultAdminRole,
        });
      } catch (error) {
        console.error(`Error checking ${contractInfo.name}:`, error);
        results.push({
          contract: contractInfo.name,
          address: contractInfo.address,
          error: 'Failed to check roles',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        address: addressToCheck,
        roles: results,
        adminRoleHash: ADMIN_ROLE,
      },
    });
  } catch (error) {
    console.error('Error checking roles:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check roles' } },
      { status: 500 }
    );
  }
}

// POST - Grant or revoke role
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetAddress, action, contracts } = body;

    if (!targetAddress || !ethers.isAddress(targetAddress)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid target address required' } },
        { status: 400 }
      );
    }

    if (!action || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Action must be "grant" or "revoke"' } },
        { status: 400 }
      );
    }

    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one contract must be selected' } },
        { status: 400 }
      );
    }

    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Admin private key not configured' } },
        { status: 500 }
      );
    }

    const rpcUrl = process.env.BACKEND_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'RPC URL not configured' } },
        { status: 500 }
      );
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const results = [];

    for (const contractName of contracts) {
      const contractInfo = CONTRACTS.find((c) => c.name === contractName);
      if (!contractInfo || !contractInfo.address) {
        results.push({
          contract: contractName,
          success: false,
          error: 'Contract not found',
        });
        continue;
      }

      try {
        const contract = new ethers.Contract(contractInfo.address, ACCESS_CONTROL_ABI, wallet);

        // Check if already has/doesn't have the role
        const hasRole = await contract.hasRole(ADMIN_ROLE, targetAddress);

        if (action === 'grant' && hasRole) {
          results.push({
            contract: contractName,
            success: true,
            message: 'Already has ADMIN_ROLE',
            skipped: true,
          });
          continue;
        }

        if (action === 'revoke' && !hasRole) {
          results.push({
            contract: contractName,
            success: true,
            message: 'Does not have ADMIN_ROLE',
            skipped: true,
          });
          continue;
        }

        // Execute transaction
        const tx = action === 'grant'
          ? await contract.grantRole(ADMIN_ROLE, targetAddress)
          : await contract.revokeRole(ADMIN_ROLE, targetAddress);

        const receipt = await tx.wait();

        // Invalidate cache immediately after successful transaction
        if (receipt.status === 1) {
          invalidateAdminCache(targetAddress);

          await prisma.roleTransaction.create({
            data: {
              targetAddress,
              executedBy: walletAddress,
              action: action.toUpperCase() as 'GRANT' | 'REVOKE',
              contractName,
              contractAddress: contractInfo.address,
              roleHash: ADMIN_ROLE,
              txHash: tx.hash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
              status: 'SUCCESS',
            },
          });
        }

        results.push({
          contract: contractName,
          success: receipt.status === 1,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        });
      } catch (error) {
        console.error(`Error ${action}ing role on ${contractName}:`, error);

        // Guardar error en base de datos
        await prisma.roleTransaction.create({
          data: {
            targetAddress,
            executedBy: walletAddress,
            action: action.toUpperCase() as 'GRANT' | 'REVOKE',
            contractName,
            contractAddress: contractInfo.address || '',
            roleHash: ADMIN_ROLE,
            txHash: `failed-${Date.now()}`,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Transaction failed',
          },
        });

        results.push({
          contract: contractName,
          success: false,
          error: error instanceof Error ? error.message : 'Transaction failed',
        });
      }
    }

    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      data: {
        action,
        targetAddress,
        results,
      },
    });
  } catch (error) {
    console.error('Error managing roles:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to manage roles' } },
      { status: 500 }
    );
  }
}
