import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';

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

    const [
      totalUsers,
      totalProperties,
      pendingKyc,
      totalTransactions,
      properties
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.kYCSubmission.count({
        where: { status: 'PENDING' }
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'CONFIRMED',
          type: 'BUY'
        },
        _sum: { amount: true }
      }),
      prisma.property.findMany({
        select: {
          pricePerFraction: true,
          totalFractions: true,
          availableFractions: true
        }
      })
    ]);

    const tvl = properties.reduce((sum, prop) => {
      const soldFractions = prop.totalFractions - prop.availableFractions;
      return sum + (soldFractions * Number(prop.pricePerFraction));
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        pendingKyc,
        tvl,
        totalTransactions: Number(totalTransactions._sum.amount || 0),
        recentActivities: []
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ADMIN_DASHBOARD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
