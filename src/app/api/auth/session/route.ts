import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null
        }
      });
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null
        }
      });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        name: true,
        role: true,
        kycStatus: true,
        createdAt: true
      }
    });

    if (!user) {
      // User was deleted, clear cookie
      const response = NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null
        }
      });

      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user
      }
    });
  } catch (error: unknown) {
    // Token is invalid or expired
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Session verification error:', message);

    const response = NextResponse.json({
      success: true,
      data: {
        authenticated: false,
        user: null
      }
    });

    // Clear invalid cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}
