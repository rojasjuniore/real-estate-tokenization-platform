import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import prisma from '@/lib/db/prisma';
import { PropertyTokenABI } from '@/lib/web3/abis/PropertyToken';

const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, amount, paymentToken, txHash, buyerAddress } = body;

    // Validate required fields
    if (!propertyId || !amount || !paymentToken || !txHash || !buyerAddress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: propertyId, amount, paymentToken, txHash, buyerAddress',
          },
        },
        { status: 400 }
      );
    }

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property not found',
          },
        },
        { status: 404 }
      );
    }

    // Check available fractions
    if (property.availableFractions < amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_FRACTIONS',
            message: `Only ${property.availableFractions} fractions available`,
          },
        },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: buyerAddress.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: buyerAddress.toLowerCase(),
        },
      });
    }

    // Calculate total amount
    const totalAmount = Number(property.pricePerFraction) * amount;

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update property available fractions
      const updatedProperty = await tx.property.update({
        where: { id: propertyId },
        data: {
          availableFractions: {
            decrement: amount,
          },
        },
      });

      // Update or create portfolio entry
      const existingPortfolio = await tx.portfolio.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: propertyId,
          },
        },
      });

      let portfolio;
      if (existingPortfolio) {
        portfolio = await tx.portfolio.update({
          where: { id: existingPortfolio.id },
          data: {
            tokenAmount: {
              increment: amount,
            },
          },
        });
      } else {
        portfolio = await tx.portfolio.create({
          data: {
            userId: user.id,
            propertyId: propertyId,
            tokenAmount: amount,
          },
        });
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          propertyId: propertyId,
          type: 'BUY',
          txHash: txHash,
          amount: totalAmount,
          tokenAmount: amount,
          paymentToken: paymentToken,
          status: 'CONFIRMED',
        },
      });

      return {
        property: updatedProperty,
        portfolio,
        transaction,
      };
    });

    // Transfer tokens from treasury to buyer on-chain
    let transferTxHash: string | null = null;
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;

    if (treasuryPrivateKey && PROPERTY_TOKEN_ADDRESS && property.tokenId) {
      try {
        console.log('[Purchase] Transferring tokens from treasury to buyer...');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
        const tokenContract = new ethers.Contract(PROPERTY_TOKEN_ADDRESS, PropertyTokenABI, treasuryWallet);

        // safeTransferFrom(from, to, id, amount, data)
        const transferTx = await tokenContract.safeTransferFrom(
          treasuryWallet.address,
          buyerAddress,
          property.tokenId,
          amount,
          '0x'
        );
        console.log('[Purchase] Transfer tx sent:', transferTx.hash);

        const receipt = await transferTx.wait();
        if (receipt.status === 1) {
          transferTxHash = transferTx.hash;
          console.log('[Purchase] Tokens transferred successfully');
        } else {
          console.error('[Purchase] Token transfer failed');
        }
      } catch (transferError) {
        console.error('[Purchase] Error transferring tokens:', transferError);
        // Don't fail the purchase - payment was received, tokens can be sent manually
      }
    } else {
      console.warn('[Purchase] Token transfer skipped - missing TREASURY_PRIVATE_KEY or tokenId');
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Purchase completed successfully',
        transaction: result.transaction,
        newBalance: result.portfolio.tokenAmount,
        remainingFractions: result.property.availableFractions,
        transferTxHash,
      },
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process purchase',
        },
      },
      { status: 500 }
    );
  }
}
