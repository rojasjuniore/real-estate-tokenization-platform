import { NextRequest, NextResponse } from 'next/server';
import prisma, { serializeBigInt } from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';
import { brandConfig } from '@/config/brand.config';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const config = await prisma.systemConfig.findFirst();

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        success: true,
        data: {
          platformName: brandConfig.identity.appName,
          platformFee: 2.5,
          minInvestment: 1,
          maxInvestment: 1000000,
          kycRequired: true,
          maintenanceMode: false,
          contactEmail: '',
          treasuryWallet: '',
          acceptedTokens: ['USDC', 'USDT', 'MATIC'],
          defaultFractions: 10000
        }
      });
    }

    // Map database fields to frontend expected format
    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        platformName: config.platformName,
        platformFee: config.marketplaceCommission,
        minInvestment: config.minInvestment,
        maxInvestment: config.maxInvestment,
        kycRequired: config.kycRequired,
        maintenanceMode: config.maintenanceMode,
        contactEmail: config.contactEmail,
        treasuryWallet: config.treasuryWallet,
        acceptedTokens: config.acceptedTokens,
        defaultFractions: config.defaultFractions
      })
    });
  } catch (error) {
    console.error('Settings get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SETTINGS_GET_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      platformName,
      platformFee,
      minInvestment,
      maxInvestment,
      kycRequired,
      maintenanceMode,
      contactEmail,
      treasuryWallet,
      acceptedTokens,
      defaultFractions
    } = body;

    const currentConfig = await prisma.systemConfig.findFirst();

    const configData = {
      platformName: platformName ?? brandConfig.identity.appName,
      contactEmail: contactEmail ?? '',
      marketplaceCommission: platformFee !== undefined ? Number(platformFee) : 2.5,
      defaultFractions: defaultFractions !== undefined ? Number(defaultFractions) : 10000,
      minInvestment: minInvestment !== undefined ? Number(minInvestment) : 1,
      maxInvestment: maxInvestment !== undefined ? Number(maxInvestment) : 1000000,
      treasuryWallet: treasuryWallet ?? '',
      acceptedTokens: acceptedTokens ?? ['USDC', 'USDT', 'MATIC'],
      kycRequired: kycRequired ?? true,
      maintenanceMode: maintenanceMode ?? false
    };

    let savedConfig;

    if (!currentConfig) {
      // Create new config
      savedConfig = await prisma.systemConfig.create({
        data: configData
      });
    } else {
      // Update existing config
      savedConfig = await prisma.systemConfig.update({
        where: { id: currentConfig.id },
        data: configData
      });
    }

    // Map database fields to frontend expected format
    return NextResponse.json({
      success: true,
      data: serializeBigInt({
        platformName: savedConfig.platformName,
        platformFee: savedConfig.marketplaceCommission,
        minInvestment: savedConfig.minInvestment,
        maxInvestment: savedConfig.maxInvestment,
        kycRequired: savedConfig.kycRequired,
        maintenanceMode: savedConfig.maintenanceMode,
        contactEmail: savedConfig.contactEmail,
        treasuryWallet: savedConfig.treasuryWallet,
        acceptedTokens: savedConfig.acceptedTokens,
        defaultFractions: savedConfig.defaultFractions
      })
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SETTINGS_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
