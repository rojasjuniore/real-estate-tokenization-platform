import { brandConfig } from '@/config/brand.config';
import { BuildingTokLogo } from '@/components/icons/BuildingTokLogo';

interface BrandLogoProps {
  width?: number;
  height?: number;
  variant?: 'light' | 'dark' | 'icon-only';
  className?: string;
}

/**
 * Brand-aware logo component.
 * If NEXT_PUBLIC_CUSTOM_LOGO_URL is set, renders a custom <img>.
 * Otherwise falls back to the original BuildingTok SVG logo.
 */
export function BrandLogo({
  width = 180,
  height,
  variant = 'light',
  className = '',
}: BrandLogoProps) {
  const { customLogoUrl, customLogoDarkUrl } = brandConfig.logo;

  const logoUrl =
    variant === 'dark' && customLogoDarkUrl
      ? customLogoDarkUrl
      : customLogoUrl;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={brandConfig.identity.appName}
        width={width}
        height={height}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  return (
    <BuildingTokLogo
      width={width}
      height={height}
      variant={variant}
      className={className}
    />
  );
}
