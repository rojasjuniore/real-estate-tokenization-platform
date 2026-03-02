import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isAdmin } from '@/lib/auth/admin';
import { KYCStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';

    const kycSubmissions = await prisma.kYCSubmission.findMany({
      where: {
        status: status as KYCStatus
      },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: kycSubmissions
    });
  } catch (error) {
    console.error('KYC list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KYC_LIST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
