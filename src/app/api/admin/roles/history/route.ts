import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth/admin';

// GET - Obtener historial de transacciones de roles
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const targetAddress = searchParams.get('targetAddress');

    const where = targetAddress
      ? { targetAddress: targetAddress.toLowerCase() }
      : {};

    const transactions = await prisma.roleTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total: transactions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching role history:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch history' } },
      { status: 500 }
    );
  }
}
