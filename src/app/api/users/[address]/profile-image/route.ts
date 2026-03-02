import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import cloudinary from '@/lib/cloudinary/config';

interface RouteParams {
  params: Promise<{ address: string }>;
}

const PROFILE_FOLDER = 'tokenbyu/profiles';

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;
    const walletAddress = request.headers.get('x-wallet-address');

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ADDRESS', message: 'Invalid wallet address format' },
        },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // User can only update their own profile
    if (!walletAddress || walletAddress.toLowerCase() !== normalizedAddress) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Can only update your own profile' },
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided' },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Invalid file type. Allowed: jpeg, png, webp',
          },
        },
        { status: 400 }
      );
    }

    // Max 5MB for profile images
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 5MB' },
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: PROFILE_FOLDER,
          public_id: `profile_${normalizedAddress}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { format: 'webp' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({ secure_url: result.secure_url });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      ).end(buffer);
    });

    // Update user in database
    const user = await prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: { profileImage: uploadResult.secure_url },
      create: {
        walletAddress: normalizedAddress,
        profileImage: uploadResult.secure_url,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload image',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;
    const walletAddress = request.headers.get('x-wallet-address');

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_ADDRESS', message: 'Invalid wallet address format' },
        },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    if (!walletAddress || walletAddress.toLowerCase() !== normalizedAddress) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Can only update your own profile' },
        },
        { status: 403 }
      );
    }

    // Remove from Cloudinary
    try {
      await cloudinary.uploader.destroy(`${PROFILE_FOLDER}/profile_${normalizedAddress}`);
    } catch {
      // Ignore if image doesn't exist
    }

    // Update user
    await prisma.user.update({
      where: { walletAddress: normalizedAddress },
      data: { profileImage: null },
    });

    return NextResponse.json({
      success: true,
      data: { profileImage: null },
    });
  } catch (error) {
    console.error('Profile image delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete image',
        },
      },
      { status: 500 }
    );
  }
}
