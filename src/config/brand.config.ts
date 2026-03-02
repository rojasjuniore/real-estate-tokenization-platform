/**
 * Centralized brand configuration for white-label support.
 *
 * All values are read from NEXT_PUBLIC_* environment variables at build time.
 * Defaults match the original TokenByU/BuildingTok branding so the app
 * works identically out of the box.
 *
 * To rebrand: set the corresponding env vars in .env and rebuild.
 */

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

const identity = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'TokenByU',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'BuildingTok',
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || 'BUILDINGTOK S.A.S.',
  taxId: process.env.NEXT_PUBLIC_TAX_ID || 'CUIT 30-71812345-6',
  tagline:
    process.env.NEXT_PUBLIC_TAGLINE ||
    'Tokenización de Bienes Raíces',
  description:
    process.env.NEXT_PUBLIC_DESCRIPTION ||
    'Invierte en propiedades premium desde $100. Plataforma de tokenización de bienes raíces en Polygon. Compra, vende y recibe dividendos de propiedades tokenizadas.',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://tokenbyu.com',
  locale: process.env.NEXT_PUBLIC_LOCALE || 'es_ES',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte@tokenbyu.com',
  telegramHandle:
    process.env.NEXT_PUBLIC_TELEGRAM_HANDLE || '@tokenbyu_soporte',
} as const;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const colors = {
  primary: {
    50: process.env.NEXT_PUBLIC_COLOR_PRIMARY_50 || '#E8F4FC',
    100: process.env.NEXT_PUBLIC_COLOR_PRIMARY_100 || '#C5E4F7',
    200: process.env.NEXT_PUBLIC_COLOR_PRIMARY_200 || '#9DD2F1',
    300: process.env.NEXT_PUBLIC_COLOR_PRIMARY_300 || '#6FBDEA',
    400: process.env.NEXT_PUBLIC_COLOR_PRIMARY_400 || '#4AABE3',
    500: process.env.NEXT_PUBLIC_COLOR_PRIMARY_500 || '#1B5FA8',
    600: process.env.NEXT_PUBLIC_COLOR_PRIMARY_600 || '#0e4d80',
    700: process.env.NEXT_PUBLIC_COLOR_PRIMARY_700 || '#0b3d66',
    800: process.env.NEXT_PUBLIC_COLOR_PRIMARY_800 || '#082d4d',
    900: process.env.NEXT_PUBLIC_COLOR_PRIMARY_900 || '#051d33',
  },
  accent: {
    green: process.env.NEXT_PUBLIC_COLOR_ACCENT_GREEN || '#16d63d',
    greenDark: process.env.NEXT_PUBLIC_COLOR_ACCENT_GREEN_DARK || '#12b534',
    greenLight: process.env.NEXT_PUBLIC_COLOR_ACCENT_GREEN_LIGHT || '#4de86a',
    orange: process.env.NEXT_PUBLIC_COLOR_ACCENT_ORANGE || '#FF6B35',
    orangeLight: process.env.NEXT_PUBLIC_COLOR_ACCENT_ORANGE_LIGHT || '#FF8F66',
    yellow: process.env.NEXT_PUBLIC_COLOR_ACCENT_YELLOW || '#FFB800',
    yellowLight: process.env.NEXT_PUBLIC_COLOR_ACCENT_YELLOW_LIGHT || '#FFCC4D',
  },
  manifest: {
    themeColor: process.env.NEXT_PUBLIC_MANIFEST_THEME_COLOR || '#0e4d80',
    backgroundColor: process.env.NEXT_PUBLIC_MANIFEST_BG_COLOR || '#FFFFFF',
  },
} as const;

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------

const social = {
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '',
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '',
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || '',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || '',
  twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || '',
} as const;

// ---------------------------------------------------------------------------
// Legal
// ---------------------------------------------------------------------------

const legal = {
  disclaimerFooter:
    process.env.NEXT_PUBLIC_LEGAL_DISCLAIMER ||
    `Plataforma de tokenización y servicios sobre activos virtuales operada por ${process.env.NEXT_PUBLIC_LEGAL_NAME || 'BUILDINGTOK S.A.S.'} (${process.env.NEXT_PUBLIC_COMPANY_NAME || 'BuildingTok'} Sociedad por Acciones Simplificada), ${process.env.NEXT_PUBLIC_TAX_ID || 'CUIT 30-71234567-8'}, registrada ante la Inspección General de Justicia (IGJ) y ante la Comisión Nacional de Valores (CNV) como Proveedor de Servicios de Activos Virtuales (PSAV). Sujeta a la supervisión de la Unidad de Información Financiera (UIF) y a la normativa argentina de prevención del lavado de activos y de la financiación del terrorismo.`,
  copyrightTemplate:
    process.env.NEXT_PUBLIC_LEGAL_COPYRIGHT ||
    '{companyName} es una marca de {appName}',
  regulatoryBadge: {
    label: process.env.NEXT_PUBLIC_REGULATORY_BADGE_LABEL || 'IGJ',
    lines: (
      process.env.NEXT_PUBLIC_REGULATORY_BADGE_LINES ||
      'Inspección|General|de Justicia'
    ).split('|'),
    enabled:
      process.env.NEXT_PUBLIC_REGULATORY_BADGE_ENABLED !== 'false',
  },
} as const;

// ---------------------------------------------------------------------------
// Feature toggles
// ---------------------------------------------------------------------------

const features = {
  showRegulatoryBadge:
    process.env.NEXT_PUBLIC_FEATURE_REGULATORY_BADGE !== 'false',
  showSocialLinks:
    process.env.NEXT_PUBLIC_FEATURE_SOCIAL_LINKS !== 'false',
  enableFaucet:
    process.env.NEXT_PUBLIC_FEATURE_FAUCET !== 'false',
  enableMarketplace:
    process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE !== 'false',
  enableDividends:
    process.env.NEXT_PUBLIC_FEATURE_DIVIDENDS !== 'false',
  showAboutSection:
    process.env.NEXT_PUBLIC_FEATURE_ABOUT_SECTION !== 'false',
  showTeamSection:
    process.env.NEXT_PUBLIC_FEATURE_TEAM_SECTION !== 'false',
} as const;

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

const logo = {
  customLogoUrl: process.env.NEXT_PUBLIC_CUSTOM_LOGO_URL || '',
  customLogoDarkUrl: process.env.NEXT_PUBLIC_CUSTOM_LOGO_DARK_URL || '',
  faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico',
} as const;

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

const seo = {
  keywords: (
    process.env.NEXT_PUBLIC_SEO_KEYWORDS ||
    'tokenización,bienes raíces,inversión inmobiliaria,blockchain,polygon,crypto,real estate,tokens,dividendos,inversión fraccionada'
  ).split(','),
} as const;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const brandConfig = {
  identity,
  colors,
  social,
  legal,
  features,
  logo,
  seo,
} as const;

export type BrandConfig = typeof brandConfig;
