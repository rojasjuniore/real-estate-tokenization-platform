import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Wallet address required'
          }
        },
        { status: 401 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { kycSubmission: true }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if already submitted and not rejected
    if (user.kycSubmission && user.kycSubmission.status !== 'REJECTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'KYC_ALREADY_SUBMITTED',
            message: 'KYC already submitted'
          }
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, idFrontUrl, idBackUrl, selfieUrl } = body;

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_INFO',
            message: 'Name and email are required'
          }
        },
        { status: 400 }
      );
    }

    if (!idFrontUrl || !idBackUrl || !selfieUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_DOCUMENTS',
            message: 'All KYC documents are required'
          }
        },
        { status: 400 }
      );
    }

    let kycSubmission;

    if (user.kycSubmission && user.kycSubmission.status === 'REJECTED') {
      // Update existing submission for resubmission
      kycSubmission = await prisma.kYCSubmission.update({
        where: { id: user.kycSubmission.id },
        data: {
          idFrontUrl,
          idBackUrl,
          selfieUrl,
          status: 'PENDING',
          adminNotes: null,
          reviewedAt: null,
          reviewedBy: null,
        }
      });
    } else {
      // Create new KYC submission
      kycSubmission = await prisma.kYCSubmission.create({
        data: {
          userId: user.id,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
          status: 'PENDING'
        }
      });
    }

    // Update user KYC status and personal info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        kycStatus: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: kycSubmission.id,
        status: kycSubmission.status,
        createdAt: kycSubmission.createdAt
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('KYC submission error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'KYC_SUBMISSION_ERROR',
          message: 'Failed to submit KYC'
        }
      },
      { status: 500 }
    );
  }
}
