import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: { isPropertyAdmin: true, role: true }
    });

    // User is property admin if they have the flag OR are a general ADMIN
    const isPropertyAdmin = user?.isPropertyAdmin || user?.role === 'ADMIN';

    return NextResponse.json({
      success: true,
      data: { isPropertyAdmin }
    });
  } catch (error) {
    console.error('[property-admin] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
