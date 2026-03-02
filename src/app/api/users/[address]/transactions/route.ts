import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { serializeBigInt } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ address: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid wallet address format',
          },
        },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch all transactions for the user
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 transactions
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Get property names for transactions that have propertyId
    const propertyIds = [...new Set(transactions.filter(t => t.propertyId).map(t => t.propertyId!))];
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, name: true },
    });
    const propertyNameMap = new Map(properties.map(p => [p.id, p.name]));

    // Format transactions for the frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      tokenAmount: tx.tokenAmount,
      txHash: tx.txHash,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      propertyName: tx.propertyId ? propertyNameMap.get(tx.propertyId) : undefined,
    }));

    return NextResponse.json(serializeBigInt({
      success: true,
      data: {
        transactions: formattedTransactions,
        total: formattedTransactions.length,
      },
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch transactions',
        },
      },
      { status: 500 }
    );
  }
}
