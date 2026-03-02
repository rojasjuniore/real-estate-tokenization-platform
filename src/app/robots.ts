import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tokenbyu.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/portfolio/', '/dividends/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
