import { ImageResponse } from 'next/og';
import { brandConfig } from '@/config/brand.config';

export const runtime = 'edge';
export const alt = `${brandConfig.identity.appName} - ${brandConfig.identity.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: `linear-gradient(135deg, ${brandConfig.colors.primary[600]} 0%, ${brandConfig.colors.primary[500]} 100%)`,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <span style={{ fontSize: 48, color: 'white' }}>🏢</span>
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: 'white',
              letterSpacing: -2,
            }}
          >
            {brandConfig.identity.appName}
          </span>
        </div>

        <div
          style={{
            fontSize: 32,
            color: '#a5b4fc',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          {brandConfig.identity.tagline}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 60,
            gap: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 40px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, color: '#10b981', fontWeight: 700 }}>$100</span>
            <span style={{ fontSize: 16, color: '#94a3b8' }}>Inversión mínima</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 40px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, color: '#7c3aed', fontWeight: 700 }}>Polygon</span>
            <span style={{ fontSize: 16, color: '#94a3b8' }}>Blockchain</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 40px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, color: '#f59e0b', fontWeight: 700 }}>24/7</span>
            <span style={{ fontSize: 16, color: '#94a3b8' }}>Liquidez</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
