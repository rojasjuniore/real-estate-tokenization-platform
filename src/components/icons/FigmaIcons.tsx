/**
 * Figma Icons - Iconos del diseño Figma para el Sidebar
 *
 * Estos iconos reemplazan los iconos genéricos actuales
 * para alinear con el diseño de Figma (node 79:1787)
 *
 * Uso:
 * import { IconSesion, IconProyectos, IconRespaldo, IconSoporte } from '@/components/icons/FigmaIcons';
 */

import React from 'react';
import { brandConfig } from '@/config/brand.config';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

const defaultColor = brandConfig.colors.primary[600];

/**
 * Icon Home
 * Casa para página principal
 */
export function IconHome({ className, size = 30, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Casa */}
      <path
        d="M4 12L15 3l11 9v13a2 2 0 01-2 2H6a2 2 0 01-2-2V12z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Puerta */}
      <path
        d="M11 27V17h8v10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Icon Sesion (Iniciar Sesión)
 * Persona con símbolo de login
 * Figma node: 18:369
 */
export function IconSesion({ className, size = 30, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cabeza */}
      <ellipse cx="12" cy="8" rx="5" ry="5.5" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Cuerpo */}
      <path
        d="M3 26c0-5.5 4-8 9-8s9 2.5 9 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Flecha entrada */}
      <path
        d="M22 12h6m0 0l-3-3m3 3l-3 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icon Proyectos
 * Documento con edificio
 * Figma node: 48:105
 */
export function IconProyectos({ className, size = 30, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Documento base */}
      <path
        d="M6 4a2 2 0 012-2h9l7 7v17a2 2 0 01-2 2H8a2 2 0 01-2-2V4z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Esquina doblada */}
      <path
        d="M15 2v5a2 2 0 002 2h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Edificio pequeño */}
      <rect x="10" y="12" width="10" height="12" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Ventanas */}
      <rect x="12" y="14" width="2" height="2" fill={color} />
      <rect x="16" y="14" width="2" height="2" fill={color} />
      <rect x="12" y="18" width="2" height="2" fill={color} />
      <rect x="16" y="18" width="2" height="2" fill={color} />
      {/* Puerta */}
      <rect x="14" y="21" width="2" height="3" fill={color} />
    </svg>
  );
}

/**
 * Icon Respaldo
 * Escudo de seguridad
 * Figma node: 18:372
 */
export function IconRespaldo({ className, size = 30, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Escudo */}
      <path
        d="M15 2L4 6v8c0 7.5 4.5 12.5 11 14.5 6.5-2 11-7 11-14.5V6L15 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Check mark */}
      <path
        d="M10 15l4 4 6-8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icon Soporte
 * Auriculares de soporte
 * Figma node: 18:374
 */
export function IconSoporte({ className, size = 30, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Banda superior */}
      <path
        d="M5 16V14a10 10 0 0120 0v2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Auricular izquierdo */}
      <rect x="3" y="15" width="5" height="9" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Auricular derecho */}
      <rect x="22" y="15" width="5" height="9" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Micrófono */}
      <path
        d="M8 24v2a4 4 0 004 4h3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17" cy="28" r="2" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/**
 * Icon Buscar
 * Lupa de búsqueda
 * Figma node: 18:368
 */
export function IconBuscar({ className, size = 24, color = defaultColor }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" fill="none" />
      <path
        d="M15 15l6 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Social Login Icons para AuthPanel
 */

export function IconApple({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function IconFacebook({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0014.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
    </svg>
  );
}

export function IconGoogle({ className, size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Arrow Icon para cerrar panel
 * Rotado 270deg en el diseño Figma
 */
export function IconArrowClose({ className, size = 20, color = '#d9d9d9' }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(270deg)' }}
    >
      <path
        d="M12 4l-8 8 8 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Export all icons as named exports
export const FigmaIcons = {
  Home: IconHome,
  Sesion: IconSesion,
  Proyectos: IconProyectos,
  Respaldo: IconRespaldo,
  Soporte: IconSoporte,
  Buscar: IconBuscar,
  Apple: IconApple,
  Facebook: IconFacebook,
  Google: IconGoogle,
  ArrowClose: IconArrowClose,
};

export default FigmaIcons;
