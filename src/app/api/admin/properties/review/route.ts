import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma, serializeBigInt } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';
import { PropertyTokenABI } from '@/lib/web3/abis/PropertyToken';
import { PropertyMarketplaceABI } from '@/lib/web3/abis/PropertyMarketplace';

const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS;
const PROPERTY_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137');
const DEFAULT_ROYALTY_FEE = 250; // 2.5% in basis points
const USDT_DECIMALS = 6;

// POST /api/admin/properties/review - Approve or reject a property
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
    const { propertyId, action, rejectionReason } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Property ID is required' } },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Action must be "approve" or "reject"' } },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required' } },
        { status: 400 }
      );
    }

    // Get the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    if (property.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Property is not pending review (current status: ${property.status})` } },
        { status: 400 }
      );
    }

    // Handle rejection
    if (action === 'reject') {
      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason,
          reviewedBy: walletAddress,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: serializeBigInt(updatedProperty),
      });
    }

    // Handle approval with on-chain deployment
    if (!PROPERTY_TOKEN_ADDRESS) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'PropertyToken contract address not configured' } },
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

    // Generate unique tokenId from database ID
    const tokenId = generateTokenId(property.id);
    console.log('[Review] Generated tokenId:', tokenId, 'for property:', property.id);

    // Check if token already exists on-chain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('[Review] Using RPC:', RPC_URL);
    console.log('[Review] Contract address:', PROPERTY_TOKEN_ADDRESS);

    const readContract = new ethers.Contract(PROPERTY_TOKEN_ADDRESS, PropertyTokenABI, provider);

    let exists = false;
    try {
      exists = await readContract.exists(tokenId);
      console.log('[Review] Token exists on-chain:', exists);
    } catch (existsError) {
      console.error('[Review] Error checking if token exists:', existsError);
      // If we can't check, assume it doesn't exist and try to create
    }

    if (exists) {
      // Token already exists on-chain, sync database state
      console.log('[Review] Token already exists, syncing database...');

      // Still set the property price for buyDirect
      if (PROPERTY_MARKETPLACE_ADDRESS && property.pricePerFraction) {
        try {
          console.log('[Review] Setting property price on marketplace for existing token...');
          const wallet = new ethers.Wallet(privateKey, provider);
          const marketplaceContract = new ethers.Contract(
            PROPERTY_MARKETPLACE_ADDRESS,
            PropertyMarketplaceABI,
            wallet
          );

          const pricePerToken = BigInt(Math.floor(Number(property.pricePerFraction) * (10 ** USDT_DECIMALS)));
          const setPriceTx = await marketplaceContract.setPropertyPrice(
            tokenId,
            pricePerToken,
            USDT_ADDRESS
          );
          await setPriceTx.wait();
          console.log('[Review] setPropertyPrice confirmed for existing token');
        } catch (priceError) {
          console.error('[Review] Error setting property price for existing token:', priceError);
        }
      }

      const updatedProperty = await prisma.property.update({
        where: { id: propertyId },
        data: {
          status: 'ACTIVE',
          tokenId: tokenId,
          contractAddress: PROPERTY_TOKEN_ADDRESS,
          chainId: CHAIN_ID,
          reviewedBy: walletAddress,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          property: serializeBigInt(updatedProperty),
          blockchain: {
            tokenId,
            txHash: 'already-deployed',
            blockNumber: 0,
            contractAddress: PROPERTY_TOKEN_ADDRESS,
          },
          message: 'Token already existed on-chain, database synced',
        },
      });
    }

    // Build metadata URI
    const metadataUri = property.metadataUri || buildMetadataUri(property.id);

    // Create wallet and contract with signer
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(PROPERTY_TOKEN_ADDRESS, PropertyTokenABI, wallet);

    // Call createProperty on smart contract
    // createProperty(uint256 tokenId, uint256 supply, string propertyUri, uint96 royaltyFee)
    console.log('[Review] Calling createProperty with:', {
      tokenId,
      supply: property.totalFractions,
      metadataUri,
      royaltyFee: DEFAULT_ROYALTY_FEE,
    });

    const tx = await contract.createProperty(
      tokenId,
      property.totalFractions,
      metadataUri,
      DEFAULT_ROYALTY_FEE
    );
    console.log('[Review] Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('[Review] Transaction confirmed, status:', receipt.status);

    if (receipt.status !== 1) {
      return NextResponse.json(
        { success: false, error: { code: 'TX_FAILED', message: 'Blockchain transaction failed' } },
        { status: 500 }
      );
    }

    // Property is now active - tokens are in treasury ready for direct sales
    console.log('[Review] Property created. Tokens minted to treasury for direct sales.');

    // Set the property price on the marketplace for direct purchase
    if (PROPERTY_MARKETPLACE_ADDRESS && property.pricePerFraction) {
      try {
        console.log('[Review] Setting property price on marketplace...');
        const marketplaceContract = new ethers.Contract(
          PROPERTY_MARKETPLACE_ADDRESS,
          PropertyMarketplaceABI,
          wallet
        );

        // Convert price to USDT smallest unit (6 decimals)
        const pricePerToken = BigInt(Math.floor(Number(property.pricePerFraction) * (10 ** USDT_DECIMALS)));
        console.log('[Review] Price per token (USDT wei):', pricePerToken.toString());

        const setPriceTx = await marketplaceContract.setPropertyPrice(
          tokenId,
          pricePerToken,
          USDT_ADDRESS
        );
        console.log('[Review] setPropertyPrice tx sent:', setPriceTx.hash);

        const setPriceReceipt = await setPriceTx.wait();
        console.log('[Review] setPropertyPrice confirmed, status:', setPriceReceipt.status);
      } catch (priceError) {
        console.error('[Review] Error setting property price:', priceError);
        // Don't fail the whole approval - property is created, price can be set later
      }
    } else {
      console.warn('[Review] Skipping setPropertyPrice - marketplace address or price not configured');
    }

    // Update property with blockchain data
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: 'ACTIVE',
        tokenId: tokenId,
        contractAddress: PROPERTY_TOKEN_ADDRESS,
        mintTxHash: tx.hash,
        mintBlockNumber: receipt.blockNumber,
        chainId: CHAIN_ID,
        mintedAt: new Date(),
        metadataUri: metadataUri,
        reviewedBy: walletAddress,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        property: serializeBigInt(updatedProperty),
        blockchain: {
          tokenId,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          contractAddress: PROPERTY_TOKEN_ADDRESS,
        },
      },
    });

  } catch (error) {
    console.error('[Review] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Review] Error message:', errorMessage);

    // Handle specific blockchain errors
    if (errorMessage.includes('insufficient funds')) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_FUNDS', message: 'Admin wallet has insufficient funds for gas' } },
        { status: 500 }
      );
    }
    if (errorMessage.includes('execution reverted')) {
      // Try to extract the revert reason
      const revertMatch = errorMessage.match(/reason="([^"]+)"/);
      const revertReason = revertMatch ? revertMatch[1] : 'Unknown reason';
      return NextResponse.json(
        { success: false, error: { code: 'CONTRACT_ERROR', message: `Smart contract reverted: ${revertReason}` } },
        { status: 500 }
      );
    }
    if (errorMessage.includes('could not coalesce error')) {
      return NextResponse.json(
        { success: false, error: { code: 'RPC_ERROR', message: 'RPC connection error. Please try again.' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMessage } },
      { status: 500 }
    );
  }
}

// Generate a unique tokenId from the database property ID
function generateTokenId(propertyDbId: string): number {
  // Use a hash of the UUID to generate a unique integer
  const hash = ethers.keccak256(ethers.toUtf8Bytes(propertyDbId));
  // Take first 8 bytes and convert to number (safe for JavaScript)
  const tokenId = parseInt(hash.slice(2, 18), 16) % Number.MAX_SAFE_INTEGER;
  return tokenId;
}

// Build metadata URI for the property
function buildMetadataUri(propertyId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tokenbyu.com';
  return `${baseUrl}/api/properties/${propertyId}/metadata`;
}
