import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import prisma, { serializeBigInt } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ROYALTY_DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS;
// Use dedicated backend RPC to avoid conflicts with frontend Web3Auth transactions
const RPC_URL = process.env.BACKEND_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

// Payment token addresses on Polygon Mainnet
const PAYMENT_TOKENS: Record<string, { address: string; decimals: number }> = {
  USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
  USDC: { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', decimals: 6 },
};

// ERC20 ABI for approve
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// RoyaltyDistributor ABI
const ROYALTY_DISTRIBUTOR_ABI = [
  'function createDistribution(uint256 propertyId, uint256 amount, address paymentToken) returns (uint256)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function grantRole(bytes32 role, address account)',
  'event DistributionCreated(uint256 indexed distributionId, uint256 indexed propertyId, uint256 amount, address paymentToken)',
];

// POST /api/admin/dividends/[id]/distribute - Distribute dividend to all holders
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Validate configuration
    if (!ROYALTY_DISTRIBUTOR_ADDRESS) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'RoyaltyDistributor contract address not configured' } },
        { status: 500 }
      );
    }

    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Admin private key not configured' } },
        { status: 500 }
      );
    }

    // Get dividend with property info
    const dividend = await prisma.dividend.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true,
          }
        },
        claims: {
          select: {
            id: true,
            userAddress: true,
            amount: true,
            claimed: true,
          }
        }
      }
    });

    if (!dividend) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Dividend not found' } },
        { status: 404 }
      );
    }

    if (dividend.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_DISTRIBUTED', message: 'Dividend has already been distributed or cancelled' } },
        { status: 400 }
      );
    }

    if (dividend.claims.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CLAIMS', message: 'No claims to distribute' } },
        { status: 400 }
      );
    }

    if (!dividend.property.tokenId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN_ID', message: 'Property does not have a tokenId' } },
        { status: 400 }
      );
    }

    // Get payment token config
    const tokenConfig = PAYMENT_TOKENS[dividend.paymentToken.toUpperCase()];
    if (!tokenConfig) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: `Invalid payment token: ${dividend.paymentToken}` } },
        { status: 400 }
      );
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log('[Distribute] Using wallet:', wallet.address);
    console.log('[Distribute] RoyaltyDistributor:', ROYALTY_DISTRIBUTOR_ADDRESS);
    console.log('[Distribute] PropertyTokenId:', dividend.property.tokenId.toString());
    console.log('[Distribute] Amount:', dividend.totalAmount, dividend.paymentToken);

    // Calculate amount in smallest unit
    const amountInSmallestUnit = BigInt(
      Math.floor(Number(dividend.totalAmount) * 10 ** tokenConfig.decimals)
    );

    // Step 1: Check balance
    const tokenContract = new ethers.Contract(tokenConfig.address, ERC20_ABI, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    console.log('[Distribute] Wallet balance:', ethers.formatUnits(balance, tokenConfig.decimals), dividend.paymentToken);

    if (balance < amountInSmallestUnit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient ${dividend.paymentToken} balance. Have: ${ethers.formatUnits(balance, tokenConfig.decimals)}, Need: ${dividend.totalAmount}`
          }
        },
        { status: 400 }
      );
    }

    // Step 2: Check and approve allowance
    let approvalTxHash: string | null = null;
    const currentAllowance = await tokenContract.allowance(wallet.address, ROYALTY_DISTRIBUTOR_ADDRESS);
    console.log('[Distribute] Current allowance:', ethers.formatUnits(currentAllowance, tokenConfig.decimals));

    if (currentAllowance < amountInSmallestUnit) {
      console.log('[Distribute] Approving tokens...');

      // Get current gas price and add 20% buffer for faster confirmation
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ? (feeData.gasPrice * 120n) / 100n : undefined;

      const approveTx = await tokenContract.approve(ROYALTY_DISTRIBUTOR_ADDRESS, amountInSmallestUnit, {
        gasPrice,
      });
      console.log('[Distribute] Approval tx sent:', approveTx.hash, 'Gas price:', gasPrice?.toString());
      approvalTxHash = approveTx.hash;

      const approveReceipt = await approveTx.wait();
      if (approveReceipt.status !== 1) {
        return NextResponse.json(
          { success: false, error: { code: 'APPROVAL_FAILED', message: 'Token approval transaction failed' } },
          { status: 500 }
        );
      }
      console.log('[Distribute] Approval confirmed');
    } else {
      console.log('[Distribute] Sufficient allowance already exists');
    }

    // Step 3: Create distribution on blockchain
    console.log('[Distribute] Creating distribution on blockchain...');
    const royaltyDistributor = new ethers.Contract(ROYALTY_DISTRIBUTOR_ADDRESS, ROYALTY_DISTRIBUTOR_ABI, wallet);

    // Get fresh gas price for distribution tx
    const distributeFeeData = await provider.getFeeData();
    const distributeGasPrice = distributeFeeData.gasPrice ? (distributeFeeData.gasPrice * 120n) / 100n : undefined;

    const distributeTx = await royaltyDistributor.createDistribution(
      dividend.property.tokenId,
      amountInSmallestUnit,
      tokenConfig.address,
      { gasPrice: distributeGasPrice }
    );
    console.log('[Distribute] Distribution tx sent:', distributeTx.hash, 'Gas price:', distributeGasPrice?.toString());

    const distributeReceipt = await distributeTx.wait();
    if (distributeReceipt.status !== 1) {
      return NextResponse.json(
        { success: false, error: { code: 'DISTRIBUTION_FAILED', message: 'Distribution transaction failed' } },
        { status: 500 }
      );
    }
    console.log('[Distribute] Distribution confirmed');

    // Extract distributionId from event
    let onChainDistributionId: number | null = null;
    for (const log of distributeReceipt.logs || []) {
      if (log.address?.toLowerCase() === ROYALTY_DISTRIBUTOR_ADDRESS.toLowerCase()) {
        try {
          const parsed = royaltyDistributor.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === 'DistributionCreated') {
            onChainDistributionId = Number(parsed.args.distributionId);
            console.log('[Distribute] Distribution ID:', onChainDistributionId);
            break;
          }
        } catch {
          // Not the event we're looking for
        }
      }
    }

    // Step 4: Update database
    const updatedDividend = await prisma.dividend.update({
      where: { id },
      data: {
        status: 'DISTRIBUTED',
        distributedAt: new Date(),
        onChainDistributionId: onChainDistributionId,
        approvalTxHash: approvalTxHash,
        txHash: distributeTx.hash,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            tokenId: true,
          }
        }
      }
    });

    // Get summary stats
    const totalHolders = dividend.claims.length;
    const totalAmount = dividend.claims.reduce((sum, c) => sum + Number(c.amount), 0);

    // Create distribution transactions for tracking
    const userAddresses = [...new Set(dividend.claims.map(c => c.userAddress))];
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: userAddresses } },
      select: { id: true, walletAddress: true }
    });

    const userIdMap = new Map(users.map(u => [u.walletAddress, u.id]));

    // Create transaction records for each claim
    const transactionPromises = dividend.claims.map(async (claim) => {
      const userId = userIdMap.get(claim.userAddress);
      if (!userId) return null;

      return prisma.transaction.create({
        data: {
          userId,
          propertyId: dividend.propertyId,
          type: 'DIVIDEND_DISTRIBUTION',
          amount: Number(claim.amount),
          paymentToken: dividend.paymentToken,
          txHash: `dividend-${dividend.id}-${claim.id}`,
          status: 'CONFIRMED',
        }
      }).catch(() => null); // Ignore if txHash already exists
    });

    await Promise.all(transactionPromises);

    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        dividend: updatedDividend,
        blockchain: {
          approvalTxHash,
          txHash: distributeTx.hash,
          onChainDistributionId,
        },
        distribution: {
          totalHolders,
          totalAmount,
          amountPerToken: Number(dividend.amountPerToken),
          paymentToken: dividend.paymentToken,
          distributedAt: updatedDividend.distributedAt,
        },
        message: `Successfully distributed ${totalAmount.toFixed(2)} ${dividend.paymentToken} to ${totalHolders} holders`
      })
    });
  } catch (error) {
    console.error('[Distribute] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific blockchain errors
    if (errorMessage.includes('insufficient funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_GAS', message: 'Admin wallet has insufficient MATIC for gas' } },
        { status: 500 }
      );
    }
    if (errorMessage.includes('execution reverted')) {
      const revertMatch = errorMessage.match(/reason="([^"]+)"/);
      const revertReason = revertMatch ? revertMatch[1] : 'Unknown reason';
      return NextResponse.json(
        { success: false, error: { code: 'CONTRACT_ERROR', message: `Smart contract reverted: ${revertReason}` } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIVIDEND_DISTRIBUTE_ERROR',
          message: errorMessage
        }
      },
      { status: 500 }
    );
  }
}
