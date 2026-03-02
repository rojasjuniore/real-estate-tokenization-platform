import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Wallet address required' },
      }, { status: 401 });
    }

    console.log('[API Admin Check] Checking wallet:', walletAddress);

    const adminStatus = await isAdmin(walletAddress);
    console.log('[API Admin Check] isAdmin result:', adminStatus);

    return NextResponse.json({
      success: true,
      data: { isAdmin: adminStatus },
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Error checking admin status' },
    }, { status: 500 });
  }
}
