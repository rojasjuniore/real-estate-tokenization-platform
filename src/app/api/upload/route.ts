import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER, UploadResult } from '@/lib/cloudinary/config';
import { isAdmin } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress || !(await isAdmin(walletAddress))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin access required' }
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_FILES', message: 'No files provided' }
        },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: `Invalid file type: ${file.type}. Allowed: jpeg, png, webp, avif`
            }
          },
          { status: 400 }
        );
      }

      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 10MB' }
          },
          { status: 400 }
        );
      }
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return new Promise<UploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: CLOUDINARY_FOLDER,
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 675, crop: 'fill', gravity: 'auto' }, // 16:9 aspect ratio
              { quality: 'auto:good' },
              { format: 'webp' }
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
              });
            } else {
              reject(new Error('Upload failed'));
            }
          }
        ).end(buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      data: {
        images: results.map(r => r.secure_url),
        details: results,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload images'
        }
      },
      { status: 500 }
    );
  }
}
