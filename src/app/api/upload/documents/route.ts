import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary/config';
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

    // Validate file types - PDF only
    const allowedTypes = ['application/pdf'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: `Invalid file type: ${file.type}. Only PDF files are allowed`
            }
          },
          { status: 400 }
        );
      }

      // Max 20MB per file for PDFs
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 20MB' }
          },
          { status: 400 }
        );
      }
    }

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sanitize filename for Cloudinary public_id
      const sanitizedName = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);

      return new Promise<{ url: string; name: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `${CLOUDINARY_FOLDER}/documents`,
            resource_type: 'raw',
            public_id: `${sanitizedName}_${Date.now()}`,
            use_filename: false,
            unique_filename: false,
            access_mode: 'public',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              // Build URL with fl_attachment flag for proper download/viewing
              const url = result.secure_url;
              resolve({
                url,
                name: file.name,
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
        documents: results,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload documents'
        }
      },
      { status: 500 }
    );
  }
}
