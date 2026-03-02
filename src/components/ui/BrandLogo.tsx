import { brandConfig } from '@/config/brand.config';

interface BrandLogoProps {
  width?: number;
  height?: number;
  variant?: 'light' | 'dark' | 'icon-only';
  className?: string;
}

/**
 * Brand-aware logo component.
 * If NEXT_PUBLIC_CUSTOM_LOGO_URL is set, renders a custom <img>.
 * Otherwise renders the app name as styled text.
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

  const textColor = variant === 'dark' ? 'text-white' : 'text-primary-700';

  return (
    <span
      className={`font-bold tracking-tight ${textColor} ${className}`}
      style={{ fontSize: Math.max(16, Math.round(width / 8)) }}
    >
      {brandConfig.identity.appName}
    </span>
  );
}
