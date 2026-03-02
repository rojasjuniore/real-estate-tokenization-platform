'use client';

import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, size = 'md', fallback, status, src, alt, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    };

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-neutral-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    const getFallbackInitials = () => {
      if (!fallback) return '?';
      return fallback
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div className={cn('relative inline-flex', sizes[size])}>
        {src ? (
          <img
            ref={ref}
            src={src}
            alt={alt || 'Avatar'}
            className={cn(
              'rounded-full object-cover w-full h-full',
              'ring-2 ring-white dark:ring-neutral-800',
              className
            )}
            {...props}
          />
        ) : (
          <div
            className={cn(
              'rounded-full w-full h-full flex items-center justify-center',
              'bg-gradient-to-br from-primary-400 to-primary-600',
              'text-white font-medium',
              'ring-2 ring-white dark:ring-neutral-800',
              className
            )}
          >
            {getFallbackInitials()}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-neutral-800',
              statusColors[status],
              statusSizes[size]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
