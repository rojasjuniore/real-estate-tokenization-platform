import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, email, name, profileImage } = body;

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_WALLET_ADDRESS',
            message: 'Wallet address is required'
          }
        },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress,
          email: email || null,
          name: name || null,
        }
      });
    } else {
      // Update user info if provided
      if (email || name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(email && { email }),
            ...(name && { name }),
          }
        });
      }
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      kycStatus: user.kycStatus
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus
        },
        token
      }
    });

    // Set HTTP-only cookie for security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: 'Failed to login'
        }
      },
      { status: 500 }
    );
  }
}
