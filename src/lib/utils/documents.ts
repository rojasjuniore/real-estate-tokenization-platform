/**
 * Utility functions for handling document URLs
 */

/**
 * Get the proper URL for viewing a PDF document
 * Uses proxy endpoint to avoid CORS issues with Cloudinary raw files
 */
export function getDocumentViewUrl(url: string): string {
  if (!url) return '';

  // If it's a Cloudinary URL, use the proxy
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return `/api/documents/proxy?url=${encodeURIComponent(url)}`;
  }

  // Otherwise return as-is
  return url;
}

/**
 * Get the download URL for a document
 */
export function getDocumentDownloadUrl(url: string): string {
  if (!url) return '';

  // For Cloudinary, add fl_attachment transformation
  if (url.includes('cloudinary.com') && url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
  }

  return url;
}

/**
 * Extract filename from document URL
 */
export function getDocumentFilename(url: string, fallback = 'Documento'): string {
  if (!url) return fallback;

  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    // Remove query params and decode
    const cleanName = decodeURIComponent(filename.split('?')[0]);
    return cleanName || fallback;
  } catch {
    return fallback;
  }
}
