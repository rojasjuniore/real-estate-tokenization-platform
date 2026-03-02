import type { Metadata } from "next";
import { Inter, Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { BrandThemeProvider } from "@/components/providers/BrandThemeProvider";
import { brandConfig } from "@/config/brand.config";

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

const { identity, seo, logo } = brandConfig;

export const metadata: Metadata = {
  metadataBase: new URL(identity.siteUrl),
  title: {
    default: `${identity.appName} - ${identity.tagline}`,
    template: `%s | ${identity.appName}`,
  },
  description: identity.description,
  keywords: seo.keywords,
  authors: [{ name: identity.appName }],
  creator: identity.appName,
  publisher: identity.appName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: identity.locale,
    url: identity.siteUrl,
    siteName: identity.appName,
    title: `${identity.appName} - ${identity.tagline}`,
    description: identity.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${identity.appName} - ${identity.tagline}`,
    description: identity.description,
  },
  icons: {
    icon: logo.faviconUrl,
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: identity.siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={identity.locale.split('_')[0]}>
      <body
        className={`${inter.variable} ${poppins.variable} ${robotoMono.variable} antialiased`}
      >
        <BrandThemeProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </BrandThemeProvider>
      </body>
    </html>
  );
}
