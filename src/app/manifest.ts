import type { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';

export default function manifest(): MetadataRoute.Manifest {
  const { identity, colors } = brandConfig;

  return {
    name: `${identity.appName} - ${identity.tagline}`,
    short_name: identity.appName,
    description: identity.description,
    start_url: '/',
    display: 'standalone',
    background_color: colors.manifest.backgroundColor,
    theme_color: colors.manifest.themeColor,
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['finance', 'business'],
    lang: identity.locale.split('_')[0],
  };
}
