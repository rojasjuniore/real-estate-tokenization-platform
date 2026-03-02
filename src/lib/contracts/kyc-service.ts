import { ethers } from 'ethers';

const KYC_ABI = [
  'function approveKYC(address wallet) external',
  'function revokeKYC(address wallet) external',
  'function isKYCApproved(address wallet) view returns (bool)',
];

interface KYCApprovalResult {
  success: boolean;
  marketplaceTxHash?: string;
  paymentProcessorTxHash?: string;
  error?: string;
}

/**
 * Approves KYC for a wallet on both PropertyMarketplace and PaymentProcessor contracts
 */
export async function approveKYCOnChain(walletAddress: string): Promise<KYCApprovalResult> {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    return { success: false, error: 'ADMIN_PRIVATE_KEY not configured' };
  }

  const marketplaceAddress = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS;
  const paymentProcessorAddress = process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS;

  if (!marketplaceAddress || !paymentProcessorAddress) {
    return { success: false, error: 'Contract addresses not configured' };
  }

  const rpcUrl = process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    return { success: false, error: 'RPC URL not configured' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const marketplace = new ethers.Contract(marketplaceAddress, KYC_ABI, wallet);
    const paymentProcessor = new ethers.Contract(paymentProcessorAddress, KYC_ABI, wallet);

    // Check if already approved on each contract
    const [marketplaceApproved, paymentProcessorApproved] = await Promise.all([
      marketplace.isKYCApproved(walletAddress),
      paymentProcessor.isKYCApproved(walletAddress),
    ]);

    let marketplaceTxHash: string | undefined;
    let paymentProcessorTxHash: string | undefined;

    // Approve on Marketplace if not already approved
    if (!marketplaceApproved) {
      const tx1 = await marketplace.approveKYC(walletAddress);
      const receipt1 = await tx1.wait();
      marketplaceTxHash = receipt1.hash;
    }

    // Approve on PaymentProcessor if not already approved
    if (!paymentProcessorApproved) {
      const tx2 = await paymentProcessor.approveKYC(walletAddress);
      const receipt2 = await tx2.wait();
      paymentProcessorTxHash = receipt2.hash;
    }

    return {
      success: true,
      marketplaceTxHash,
      paymentProcessorTxHash,
    };
  } catch (error) {
    console.error('[approveKYCOnChain] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revokes KYC for a wallet on both PropertyMarketplace and PaymentProcessor contracts
 */
export async function revokeKYCOnChain(walletAddress: string): Promise<KYCApprovalResult> {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    return { success: false, error: 'ADMIN_PRIVATE_KEY not configured' };
  }

  const marketplaceAddress = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS;
  const paymentProcessorAddress = process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS;

  if (!marketplaceAddress || !paymentProcessorAddress) {
    return { success: false, error: 'Contract addresses not configured' };
  }

  const rpcUrl = process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    return { success: false, error: 'RPC URL not configured' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const marketplace = new ethers.Contract(marketplaceAddress, KYC_ABI, wallet);
    const paymentProcessor = new ethers.Contract(paymentProcessorAddress, KYC_ABI, wallet);

    // Check if approved on each contract
    const [marketplaceApproved, paymentProcessorApproved] = await Promise.all([
      marketplace.isKYCApproved(walletAddress),
      paymentProcessor.isKYCApproved(walletAddress),
    ]);

    let marketplaceTxHash: string | undefined;
    let paymentProcessorTxHash: string | undefined;

    // Revoke on Marketplace if approved
    if (marketplaceApproved) {
      const tx1 = await marketplace.revokeKYC(walletAddress);
      const receipt1 = await tx1.wait();
      marketplaceTxHash = receipt1.hash;
    }

    // Revoke on PaymentProcessor if approved
    if (paymentProcessorApproved) {
      const tx2 = await paymentProcessor.revokeKYC(walletAddress);
      const receipt2 = await tx2.wait();
      paymentProcessorTxHash = receipt2.hash;
    }

    return {
      success: true,
      marketplaceTxHash,
      paymentProcessorTxHash,
    };
  } catch (error) {
    console.error('[revokeKYCOnChain] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if wallet has KYC approved on both contracts
 */
export async function checkKYCStatus(walletAddress: string): Promise<{
  marketplace: boolean;
  paymentProcessor: boolean;
}> {
  const marketplaceAddress = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS;
  const paymentProcessorAddress = process.env.NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS;
  const rpcUrl = process.env.POLYGON_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;

  if (!marketplaceAddress || !paymentProcessorAddress || !rpcUrl) {
    return { marketplace: false, paymentProcessor: false };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const marketplace = new ethers.Contract(marketplaceAddress, KYC_ABI, provider);
    const paymentProcessor = new ethers.Contract(paymentProcessorAddress, KYC_ABI, provider);

    const [marketplaceApproved, paymentProcessorApproved] = await Promise.all([
      marketplace.isKYCApproved(walletAddress),
      paymentProcessor.isKYCApproved(walletAddress),
    ]);

    return {
      marketplace: marketplaceApproved,
      paymentProcessor: paymentProcessorApproved,
    };
  } catch (error) {
    console.error('[checkKYCStatus] Error:', error);
    return { marketplace: false, paymentProcessor: false };
  }
}
