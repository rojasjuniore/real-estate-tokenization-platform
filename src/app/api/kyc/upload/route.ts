import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/config';

const KYC_FOLDER = 'tokenbyu/kyc';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'File is required'
          }
        },
        { status: 400 }
      );
    }

    if (!documentType || !['idFront', 'idBack', 'selfie'].includes(documentType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DOCUMENT_TYPE',
            message: 'Document type must be idFront, idBack, or selfie'
          }
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
            message: 'File must be JPEG, PNG, or WebP'
          }
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File must be less than 5MB'
          }
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public_id for the file
    const timestamp = Date.now();
    const sanitizedWallet = walletAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
    const publicId = `${KYC_FOLDER}/${sanitizedWallet}/${documentType}_${timestamp}`;

    // Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `${KYC_FOLDER}/${sanitizedWallet}`,
          public_id: `${documentType}_${timestamp}`,
          resource_type: 'image',
          type: 'private', // Private upload - requires signed URL to access
          access_mode: 'authenticated',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload failed - no result'));
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        documentType,
        size: file.size,
        type: file.type
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('KYC upload error:', message);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload document'
        }
      },
      { status: 500 }
    );
  }
}
