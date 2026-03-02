import { createPublicClient, http, parseAbiItem } from 'viem';
import { polygon } from 'viem/chains';
import prisma from '@/lib/db/prisma';

// Decoded log type with args
interface DecodedLog<T = Record<string, unknown>> {
  args: T;
  transactionHash?: `0x${string}`;
  address?: `0x${string}`;
  blockNumber?: bigint;
}

// Event signatures
const PROPERTY_CREATED_EVENT = parseAbiItem(
  'event PropertyCreated(uint256 indexed tokenId, uint256 totalSupply, address indexed treasury)'
);

const TRANSFER_SINGLE_EVENT = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
);

const LISTING_CREATED_EVENT = parseAbiItem(
  'event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed propertyId, uint256 amount, uint256 pricePerToken, address paymentToken)'
);

const SALE_EVENT = parseAbiItem(
  'event Sale(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)'
);

const DISTRIBUTION_CREATED_EVENT = parseAbiItem(
  'event DistributionCreated(uint256 indexed distributionId, uint256 indexed propertyId, uint256 totalAmount, address paymentToken)'
);

const ROYALTY_CLAIMED_EVENT = parseAbiItem(
  'event RoyaltyClaimed(uint256 indexed distributionId, address indexed user, uint256 amount)'
);

// Create public client
const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

/**
 * Process PropertyCreated event from PropertyToken contract
 */
export async function processPropertyCreated(
  log: DecodedLog<{ tokenId: bigint; totalSupply: bigint; treasury: `0x${string}` }>
) {
  const { tokenId, totalSupply } = log.args;

  // Update property if exists, or log for manual creation
  await prisma.property.updateMany({
    where: { tokenId: Number(tokenId) },
    data: {
      totalFractions: Number(totalSupply),
      availableFractions: Number(totalSupply),
      status: 'ACTIVE',
    },
  });

  console.log(`PropertyCreated: tokenId=${tokenId}, supply=${totalSupply}`);
}

/**
 * Process TransferSingle event to update portfolios
 */
export async function processTransferSingle(
  log: DecodedLog<{
    operator: `0x${string}`;
    from: `0x${string}`;
    to: `0x${string}`;
    id: bigint;
    value: bigint;
  }>
) {
  const { from, to, id, value } = log.args;

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const tokenId = Number(id);
  const amount = Number(value);

  // Find property by tokenId
  const property = await prisma.property.findUnique({
    where: { tokenId },
    select: { id: true },
  });

  if (!property) {
    console.log(`Property not found for tokenId: ${tokenId}`);
    return;
  }

  // Decrease sender's balance (unless minting)
  if (from.toLowerCase() !== ZERO_ADDRESS) {
    const fromUser = await prisma.user.upsert({
      where: { walletAddress: from.toLowerCase() },
      update: {},
      create: { walletAddress: from.toLowerCase() },
    });

    await prisma.portfolio.upsert({
      where: {
        userId_propertyId: {
          userId: fromUser.id,
          propertyId: property.id,
        },
      },
      update: {
        tokenAmount: {
          decrement: amount,
        },
      },
      create: {
        userId: fromUser.id,
        propertyId: property.id,
        tokenAmount: 0, // Will be negative, handle in query
      },
    });
  }

  // Increase receiver's balance (unless burning)
  if (to.toLowerCase() !== ZERO_ADDRESS) {
    const toUser = await prisma.user.upsert({
      where: { walletAddress: to.toLowerCase() },
      update: {},
      create: { walletAddress: to.toLowerCase() },
    });

    await prisma.portfolio.upsert({
      where: {
        userId_propertyId: {
          userId: toUser.id,
          propertyId: property.id,
        },
      },
      update: {
        tokenAmount: {
          increment: amount,
        },
      },
      create: {
        userId: toUser.id,
        propertyId: property.id,
        tokenAmount: amount,
      },
    });
  }

  console.log(`TransferSingle: from=${from}, to=${to}, id=${id}, value=${value}`);
}

/**
 * Process ListingCreated event
 */
export async function processListingCreated(
  log: DecodedLog<{
    listingId: bigint;
    seller: `0x${string}`;
    propertyId: bigint;
    amount: bigint;
    pricePerToken: bigint;
    paymentToken: `0x${string}`;
  }>
) {
  const { listingId, seller, propertyId, amount, pricePerToken, paymentToken } = log.args;

  const property = await prisma.property.findUnique({
    where: { tokenId: Number(propertyId) },
    select: { id: true },
  });

  if (!property) {
    console.log(`Property not found for tokenId: ${propertyId}`);
    return;
  }

  // Determine payment token symbol
  const paymentTokenLower = paymentToken.toLowerCase();
  let paymentTokenSymbol = 'MATIC';
  if (paymentTokenLower === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f') {
    paymentTokenSymbol = 'USDT';
  } else if (paymentTokenLower === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359') {
    paymentTokenSymbol = 'USDC';
  } else if (paymentTokenLower === '0x0000000000000000000000000000000000000000') {
    paymentTokenSymbol = 'MATIC';
  }

  // Upsert listing with onChainListingId
  await prisma.listing.upsert({
    where: { onChainListingId: Number(listingId) },
    update: {
      amount: Number(amount),
      remainingAmount: Number(amount),
      pricePerToken: Number(pricePerToken) / 1e6, // Assuming 6 decimals
      status: 'ACTIVE',
    },
    create: {
      onChainListingId: Number(listingId),
      propertyId: property.id,
      seller: seller.toLowerCase(),
      amount: Number(amount),
      remainingAmount: Number(amount),
      pricePerToken: Number(pricePerToken) / 1e6,
      paymentToken: paymentTokenSymbol,
      paymentTokenAddress: paymentTokenLower,
      status: 'ACTIVE',
    },
  });

  console.log(`ListingCreated: onChainId=${listingId}, seller=${seller}, propertyId=${propertyId}`);
}

/**
 * Process Sale event (formerly ListingSold)
 */
export async function processSale(
  log: DecodedLog<{
    listingId: bigint;
    buyer: `0x${string}`;
    amount: bigint;
    totalPrice: bigint;
  }>
) {
  const { listingId, buyer, amount, totalPrice } = log.args;

  const listing = await prisma.listing.findFirst({
    where: { onChainListingId: Number(listingId) },
  });

  if (!listing) {
    console.log(`Listing not found for onChainListingId: ${listingId}`);
    return;
  }

  // Decrease remaining amount
  const currentRemaining = listing.remainingAmount ?? listing.amount;
  const newRemainingAmount = currentRemaining - Number(amount);

  if (newRemainingAmount <= 0) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        remainingAmount: 0,
        status: 'SOLD',
        buyer: buyer.toLowerCase(),
        buyTxHash: log.transactionHash,
      },
    });
  } else {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { remainingAmount: newRemainingAmount },
    });
  }

  // Record transaction
  const user = await prisma.user.upsert({
    where: { walletAddress: buyer.toLowerCase() },
    update: {},
    create: { walletAddress: buyer.toLowerCase() },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      propertyId: listing.propertyId,
      type: 'BUY',
      txHash: log.transactionHash || `listing-${listingId}-${Date.now()}`,
      amount: Number(amount) * Number(listing.pricePerToken),
      tokenAmount: Number(amount),
      paymentToken: listing.paymentToken,
      status: 'CONFIRMED',
    },
  });

  console.log(`Sale: listingId=${listingId}, buyer=${buyer}, amount=${amount}`);
}

/**
 * Process ListingCancelled event
 */
export async function processListingCancelled(
  log: DecodedLog<{
    listingId: bigint;
    seller: `0x${string}`;
  }>
) {
  const { listingId, seller } = log.args;

  const listing = await prisma.listing.findFirst({
    where: { onChainListingId: Number(listingId) },
  });

  if (!listing) {
    console.log(`Listing not found for onChainListingId: ${listingId}`);
    return;
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'CANCELLED' },
  });

  console.log(`ListingCancelled: listingId=${listingId}, seller=${seller}`);
}

/**
 * Process ListingPriceUpdated event
 */
export async function processListingPriceUpdated(
  log: DecodedLog<{
    listingId: bigint;
    oldPrice: bigint;
    newPrice: bigint;
  }>
) {
  const { listingId, oldPrice, newPrice } = log.args;

  const listing = await prisma.listing.findFirst({
    where: { onChainListingId: Number(listingId) },
  });

  if (!listing) {
    console.log(`Listing not found for onChainListingId: ${listingId}`);
    return;
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { pricePerToken: Number(newPrice) / 1e6 },
  });

  console.log(`ListingPriceUpdated: listingId=${listingId}, oldPrice=${oldPrice}, newPrice=${newPrice}`);
}

/**
 * Process DistributionCreated event
 */
export async function processDistributionCreated(
  log: DecodedLog<{
    distributionId: bigint;
    propertyId: bigint;
    totalAmount: bigint;
    paymentToken: `0x${string}`;
  }>
) {
  const { distributionId, propertyId, totalAmount, paymentToken } = log.args;

  const property = await prisma.property.findUnique({
    where: { tokenId: Number(propertyId) },
    select: { id: true, totalFractions: true },
  });

  if (!property) {
    console.log(`Property not found for tokenId: ${propertyId}`);
    return;
  }

  const amountPerToken = Number(totalAmount) / property.totalFractions / 1e6;

  await prisma.dividend.create({
    data: {
      id: distributionId.toString(),
      propertyId: property.id,
      totalAmount: Number(totalAmount) / 1e6,
      amountPerToken,
      paymentToken: paymentToken.toLowerCase(),
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      txHash: log.transactionHash,
      status: 'DISTRIBUTED',
      distributedAt: new Date(),
    },
  });

  console.log(`DistributionCreated: id=${distributionId}, propertyId=${propertyId}, amount=${totalAmount}`);
}

/**
 * Process RoyaltyClaimed event
 */
export async function processRoyaltyClaimed(
  log: DecodedLog<{
    distributionId: bigint;
    user: `0x${string}`;
    amount: bigint;
  }>
) {
  const { distributionId, user, amount } = log.args;

  await prisma.dividendClaim.upsert({
    where: {
      id: `${distributionId}-${user.toLowerCase()}`,
    },
    update: {
      claimed: true,
      txHash: log.transactionHash,
      claimedAt: new Date(),
    },
    create: {
      id: `${distributionId}-${user.toLowerCase()}`,
      dividendId: distributionId.toString(),
      userAddress: user.toLowerCase(),
      amount: Number(amount) / 1e6,
      claimed: true,
      txHash: log.transactionHash,
      claimedAt: new Date(),
    },
  });

  // Also record as transaction
  const userRecord = await prisma.user.upsert({
    where: { walletAddress: user.toLowerCase() },
    update: {},
    create: { walletAddress: user.toLowerCase() },
  });

  const dividend = await prisma.dividend.findUnique({
    where: { id: distributionId.toString() },
    select: { propertyId: true, paymentToken: true },
  });

  if (dividend) {
    await prisma.transaction.create({
      data: {
        userId: userRecord.id,
        propertyId: dividend.propertyId,
        type: 'DIVIDEND_CLAIM',
        txHash: log.transactionHash || `claim-${distributionId}-${user}`,
        amount: Number(amount) / 1e6,
        paymentToken: dividend.paymentToken,
        status: 'CONFIRMED',
      },
    });
  }

  console.log(`RoyaltyClaimed: distributionId=${distributionId}, user=${user}, amount=${amount}`);
}

// ABIs for event watching
const PROPERTY_TOKEN_ABI = [PROPERTY_CREATED_EVENT, TRANSFER_SINGLE_EVENT] as const;
const MARKETPLACE_ABI = [LISTING_CREATED_EVENT, SALE_EVENT] as const;
const ROYALTY_DISTRIBUTOR_ABI = [DISTRIBUTION_CREATED_EVENT, ROYALTY_CLAIMED_EVENT] as const;

/**
 * Watch for contract events (call this on server startup or cron)
 * Note: In production, use Alchemy/Moralis webhooks instead of polling
 */
export async function watchContractEvents() {
  const propertyTokenAddress = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS as `0x${string}`;
  const marketplaceAddress = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS as `0x${string}`;
  const royaltyDistributorAddress = process.env.NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS as `0x${string}`;

  if (!propertyTokenAddress || !marketplaceAddress || !royaltyDistributorAddress) {
    console.error('Contract addresses not configured');
    return;
  }

  // Watch PropertyToken events
  publicClient.watchContractEvent({
    address: propertyTokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    eventName: 'PropertyCreated',
    onLogs: (logs) => logs.forEach((log) => processPropertyCreated(log as any)),
  });

  publicClient.watchContractEvent({
    address: propertyTokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    eventName: 'TransferSingle',
    onLogs: (logs) => logs.forEach((log) => processTransferSingle(log as any)),
  });

  // Watch Marketplace events
  publicClient.watchContractEvent({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    eventName: 'ListingCreated',
    onLogs: (logs) => logs.forEach((log) => processListingCreated(log as any)),
  });

  publicClient.watchContractEvent({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    eventName: 'Sale',
    onLogs: (logs) => logs.forEach((log) => processSale(log as any)),
  });

  // Watch RoyaltyDistributor events
  publicClient.watchContractEvent({
    address: royaltyDistributorAddress,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    eventName: 'DistributionCreated',
    onLogs: (logs) => logs.forEach((log) => processDistributionCreated(log as any)),
  });

  publicClient.watchContractEvent({
    address: royaltyDistributorAddress,
    abi: ROYALTY_DISTRIBUTOR_ABI,
    eventName: 'RoyaltyClaimed',
    onLogs: (logs) => logs.forEach((log) => processRoyaltyClaimed(log as any)),
  });

  console.log('Watching blockchain events...');
}
