import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'USERS_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
