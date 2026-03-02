'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePanelsStore } from '@/store';
import { cn } from '@/lib/utils';
import { IconArrowClose } from '@/components/icons';
import { brandConfig } from '@/config/brand.config';

interface SlidePanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SlidePanel - Panel deslizante responsive
 * - Mobile: Full screen, slides from bottom
 * - Desktop: Right side panel with curved edge
 */
export function SlidePanel({ children, className }: SlidePanelProps) {
  const { isOpen, closePanel } = usePanelsStore();

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    },
    [isOpen, closePanel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePanel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/20 z-40"
            aria-hidden="true"
          />

          {/* Mobile Panel - Full screen from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className={cn(
              'md:hidden fixed inset-x-0 bottom-0 z-50',
              'bg-white rounded-t-[24px]',
              'max-h-[90vh]',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close Button - Mobile */}
            <button
              onClick={closePanel}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
              aria-label="Cerrar panel"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content area - Mobile */}
            <div className="overflow-y-auto px-4 pt-2 pb-8 max-h-[calc(90vh-60px)]">
              {children}
            </div>
          </motion.div>

          {/* Desktop Panel - Right side with curved edge */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200,
            }}
            className={cn(
              'hidden md:flex fixed right-0 top-0 h-screen z-50',
              'items-stretch',
              className
            )}
            style={{ width: '390px' }}
            role="dialog"
            aria-modal="true"
          >
            {/* White background with curved left edge */}
            <div className="absolute inset-0 bg-white rounded-l-[80px]" />

            {/* Close Button - Desktop */}
            <button
              onClick={closePanel}
              className="absolute top-6 left-6 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all duration-200 z-20 shadow-sm"
              aria-label="Cerrar panel"
            >
              <IconArrowClose size={16} color={brandConfig.colors.primary[600]} />
            </button>

            {/* Content area - Desktop */}
            <div className="relative flex-1 h-full overflow-y-auto pl-16 pr-8 pt-16 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
