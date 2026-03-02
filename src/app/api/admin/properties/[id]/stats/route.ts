import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Get property
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        totalFractions: true,
        availableFractions: true,
        pricePerFraction: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 }
      );
    }

    // Get holders (unique users with tokens)
    const portfolios = await prisma.portfolio.findMany({
      where: {
        propertyId: id,
        tokenAmount: { gt: 0 }
      },
      select: {
        userId: true,
        tokenAmount: true,
        user: {
          select: {
            walletAddress: true,
            name: true,
          }
        }
      },
      orderBy: { tokenAmount: 'desc' },
    });

    // Get transactions for this property
    const transactions = await prisma.transaction.findMany({
      where: {
        propertyId: id,
        status: 'CONFIRMED',
        type: 'BUY',
      },
      select: {
        amount: true,
        tokenAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const soldFractions = property.totalFractions - property.availableFractions;
    const totalSalesAmount = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );
    const totalTokensSold = transactions.reduce(
      (sum, tx) => sum + (tx.tokenAmount || 0),
      0
    );

    // Treasury info (from settings or env)
    const treasuryAddress = process.env.TREASURY_ADDRESS || null;

    return NextResponse.json({
      success: true,
      data: {
        property: {
          id: property.id,
          name: property.name,
          totalFractions: property.totalFractions,
          availableFractions: property.availableFractions,
          soldFractions,
          pricePerFraction: Number(property.pricePerFraction),
        },
        sales: {
          totalAmount: totalSalesAmount,
          totalTokensSold,
          transactionCount: transactions.length,
          recentTransactions: transactions.slice(0, 5).map(tx => ({
            amount: Number(tx.amount),
            tokenAmount: tx.tokenAmount,
            date: tx.createdAt,
          })),
        },
        holders: {
          count: portfolios.length,
          list: portfolios.map(p => ({
            walletAddress: p.user.walletAddress,
            name: p.user.name,
            tokenAmount: p.tokenAmount,
            percentage: ((p.tokenAmount / property.totalFractions) * 100).toFixed(2),
          })),
        },
        treasury: {
          address: treasuryAddress,
          note: 'Los fondos van directamente a la wallet treasury configurada. No se almacenan en el contrato.',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error fetching stats' } },
      { status: 500 }
    );
  }
}
