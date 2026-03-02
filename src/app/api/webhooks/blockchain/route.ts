import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { decodeEventLog } from 'viem';
import {
  processTransferSingle,
  processListingCreated,
  processSale,
  processListingCancelled,
  processListingPriceUpdated,
} from '@/services/blockchainSync';
import { PropertyMarketplaceABI } from '@/lib/web3/abis';

// Webhook secret for verification
const WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET || '';

// Event topic hashes (keccak256 of event signature)
const EVENT_TOPICS = {
  // PropertyToken events
  PropertyCreated: '0x14813659db8a8a5a3c9f3d8b2e8c6c1f1e9a8d7c6b5a4938271605f4e3d2c1b0', // Placeholder
  TransferSingle: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
  // PropertyMarketplace events
  ListingCreated: '0x5d26d3f4b8fa9c7fc2a5c8f9aae88b4e0a7f6c5d4e3b2a190807060504030201', // Placeholder
  Sale: '0xa3da7bc3d2d8e9a7b6c5f4e3d2c1b0a09f8e7d6c5b4a39281706050403020100', // Placeholder
  ListingCancelled: '0xb4eb8cd3e3f9f0a8c7b6d5e4f3c2b1a00f9e8d7c6b5a49382817160514030201', // Placeholder
  ListingPriceUpdated: '0xc5fc9de4f4a0a1b9d8c7e6f5a4d3c2b110a0f9e8d7c6b5a4a392818170615040', // Placeholder
  // KYC events
  KYCApproved: '0xd6ad0ef5a5b1b2c0e9d8f7a6b5c4d3e221b1a0f9e8d7c6b5b4a3928281716150', // Placeholder
  KYCRevoked: '0xe7be1fa6b6c2c3d1f0e9a8b7c6d5e4f332c2b1a0f9e8d7c6c5b4a39382817261', // Placeholder
  // RoyaltyDistributor events
  DistributionCreated: '0xf8cf2ab7c7d3d4e2a1f0b9c8d7e6f5a443d3c2b1a0f9e8d7d6c5b4a4938281', // Placeholder
  RoyaltyClaimed: '0xa9da3bc8d8e4e5f3b2a1c0d9e8f7a6b554e4d3c2b1a0f9e8e7d6c5b5a493828', // Placeholder
};

/**
 * Verify webhook signature from Alchemy
 */
function verifyAlchemySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return true; // Skip if no secret configured

  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

/**
 * Process blockchain webhook from Alchemy/Moralis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-alchemy-signature') || '';

    // Verify signature
    if (!verifyAlchemySignature(body, signature)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid webhook signature',
          },
        },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);

    // Handle Alchemy webhook format
    if (payload.type === 'ADDRESS_ACTIVITY') {
      const activities = payload.event?.activity || [];

      for (const activity of activities) {
        await processActivity(activity);
      }
    }

    // Handle raw logs format
    if (payload.logs && Array.isArray(payload.logs)) {
      for (const log of payload.logs) {
        await processLog(log);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process webhook',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Process Alchemy activity format
 */
async function processActivity(activity: {
  category: string;
  fromAddress: string;
  toAddress: string;
  rawContract: {
    rawValue: string;
    address: string;
    decimals: number;
  };
  log?: {
    topics: string[];
    data: string;
    transactionHash: string;
  };
}) {
  if (!activity.log) return;

  const { log } = activity;
  await processLog({
    topics: log.topics,
    data: log.data,
    transactionHash: log.transactionHash,
    address: activity.rawContract.address,
  });
}

/**
 * Process raw log entry
 */
async function processLog(log: {
  topics: string[];
  data: string;
  transactionHash: string;
  address: string;
}) {
  const topic0 = log.topics[0];

  try {
    // Try to decode using PropertyMarketplace ABI
    const decoded = decodeEventLog({
      abi: PropertyMarketplaceABI,
      data: log.data as `0x${string}`,
      topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
    });

    const mockLog = {
      ...log,
      args: decoded.args,
      eventName: decoded.eventName,
    };

    switch (decoded.eventName) {
      case 'ListingCreated':
        await processListingCreated(mockLog as any);
        break;
      case 'Sale':
        await processSale(mockLog as any);
        break;
      case 'ListingCancelled':
        await processListingCancelled(mockLog as any);
        break;
      case 'ListingPriceUpdated':
        await processListingPriceUpdated(mockLog as any);
        break;
      case 'KYCApproved':
        await processKYCApproved(mockLog as any);
        break;
      case 'KYCRevoked':
        await processKYCRevoked(mockLog as any);
        break;
      default:
        console.log(`Unhandled event: ${decoded.eventName}`);
    }
    return;
  } catch {
    // Not a PropertyMarketplace event, try other handlers
  }

  // Fallback to topic-based matching for other contracts
  switch (topic0) {
    case EVENT_TOPICS.TransferSingle:
      const transferArgs = decodeLogArgs(log);
      await processTransferSingle({ ...log, args: transferArgs } as any);
      break;
    default:
      console.log(`Unknown event topic: ${topic0}`);
  }
}

/**
 * Process KYC Approved event - sync to database
 */
async function processKYCApproved(log: {
  args: { wallet: `0x${string}`; approvedBy: `0x${string}`; timestamp: bigint };
  transactionHash: string;
}) {
  const { wallet, approvedBy } = log.args;

  const { prisma } = await import('@/lib/db/prisma');

  await prisma.user.updateMany({
    where: { walletAddress: wallet.toLowerCase() },
    data: { kycStatus: 'APPROVED' },
  });

  console.log(`KYCApproved synced: wallet=${wallet}, approvedBy=${approvedBy}`);
}

/**
 * Process KYC Revoked event - sync to database
 */
async function processKYCRevoked(log: {
  args: { wallet: `0x${string}`; revokedBy: `0x${string}`; timestamp: bigint };
  transactionHash: string;
}) {
  const { wallet, revokedBy } = log.args;

  const { prisma } = await import('@/lib/db/prisma');

  await prisma.user.updateMany({
    where: { walletAddress: wallet.toLowerCase() },
    data: { kycStatus: 'REJECTED' },
  });

  console.log(`KYCRevoked synced: wallet=${wallet}, revokedBy=${revokedBy}`);
}

/**
 * Decode log arguments (fallback for non-ABI events)
 */
function decodeLogArgs(log: { topics: string[]; data: string }) {
  return {
    operator: log.topics[1] ? `0x${log.topics[1].slice(26)}` : undefined,
    from: log.topics[2] ? `0x${log.topics[2].slice(26)}` : undefined,
    to: log.topics[3] ? `0x${log.topics[3].slice(26)}` : undefined,
  };
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint active',
    timestamp: new Date().toISOString(),
  });
}
