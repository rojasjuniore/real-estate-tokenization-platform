import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint to serve PDFs with correct headers
// This avoids CORS issues with Cloudinary raw files
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate it's a Cloudinary URL
    if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
      return NextResponse.json(
        { success: false, error: 'Invalid document URL' },
        { status: 400 }
      );
    }

    // Fetch the PDF from Cloudinary
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();

    // Return with correct headers for PDF viewing
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Document proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to proxy document' },
      { status: 500 }
    );
  }
}
