'use client';

import { brandConfig } from '@/config/brand.config';

/**
 * Injects CSS custom properties from brandConfig.colors at runtime.
 * This overrides the defaults defined in globals.css so that changing
 * env vars is enough to rebrand all color tokens.
 *
 * Safety: all values come from process.env.NEXT_PUBLIC_* which are inlined
 * as string literals at build time by Next.js. No user input is involved.
 */
export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const { primary, accent } = brandConfig.colors;

  // Build-time env values only - no user input
  const cssVars = `
    :root {
      --primary-50: ${primary[50]};
      --primary-100: ${primary[100]};
      --primary-200: ${primary[200]};
      --primary-300: ${primary[300]};
      --primary-400: ${primary[400]};
      --primary-500: ${primary[500]};
      --primary-600: ${primary[600]};
      --primary-700: ${primary[700]};
      --primary-800: ${primary[800]};
      --primary-900: ${primary[900]};

      --accent-green: ${accent.green};
      --accent-green-dark: ${accent.greenDark};
      --accent-green-light: ${accent.greenLight};
      --accent-orange: ${accent.orange};
      --accent-orange-light: ${accent.orangeLight};
      --accent-yellow: ${accent.yellow};
      --accent-yellow-light: ${accent.yellowLight};

      --status-available: ${accent.green};
      --status-sold-out: ${accent.orange};
      --status-coming-soon: ${accent.yellow};

      --gradient-primary: linear-gradient(135deg, ${primary[600]} 0%, ${primary[500]} 100%);
      --gradient-green: linear-gradient(135deg, ${accent.greenDark} 0%, ${accent.green} 100%);
      --gradient-hero: linear-gradient(to bottom, ${primary[600]}1a 0%, transparent 100%);

      --shadow-sm: 0 1px 2px 0 ${primary[600]}0d;
      --shadow-md: 0 2px 8px ${primary[600]}14;
      --shadow-lg: 0 4px 16px ${primary[600]}1f;

      --ring: ${primary[600]};
    }
  `;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- build-time env values only, no XSS risk */}
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </>
  );
}
