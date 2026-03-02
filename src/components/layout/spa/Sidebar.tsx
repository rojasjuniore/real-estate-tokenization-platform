'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationStore, type SectionId } from '@/store';
import { usePanelsStore } from '@/store';
import { useWeb3Auth } from '@/lib/web3auth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  IconHome,
  IconSesion,
  IconProyectos,
  IconRespaldo,
  IconSoporte,
} from '@/components/icons';
import { brandConfig } from '@/config/brand.config';

interface SidebarItem {
  id: SectionId;
  label: string;
  labelConnected?: string;
  icon: React.ReactNode;
  opensPanel?: 'auth' | 'contact' | 'account' | 'about';
}

// User Avatar Component
function UserAvatar({ profileImage, userInfo, address, size = 'md' }: {
  profileImage?: string | null;
  userInfo: { name?: string; email?: string; profileImage?: string } | null;
  address: string | null;
  size?: 'sm' | 'md';
}) {
  const initial = userInfo?.name?.charAt(0)?.toUpperCase() ||
                  userInfo?.email?.charAt(0)?.toUpperCase() ||
                  address?.slice(2, 4)?.toUpperCase() ||
                  '?';

  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-[50px] h-[50px] text-lg';

  // Prefer profileImage from our DB, fallback to userInfo.profileImage from Web3Auth
  const imageUrl = profileImage || userInfo?.profileImage;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Usuario"
        className={cn(sizeClasses, 'rounded-full object-cover')}
      />
    );
  }

  return (
    <div className={cn(sizeClasses, 'rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center')}>
      <span className="text-white font-bold">{initial}</span>
    </div>
  );
}

// Connected indicator dot
const ConnectedDot = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <span className={cn(
    'absolute bottom-0 right-0 bg-accent-green border-2 border-white rounded-full',
    size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  )} />
);

// Admin Icon
const AdminIcon = ({ size = 28 }: { size?: number }) => (
  <svg className="w-7 h-7" style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

export function Sidebar() {
  const router = useRouter();
  const { activeSection, navigate } = useNavigationStore();
  const { openPanel, activePanel } = usePanelsStore();
  const { isConnected, userInfo, address, logout } = useWeb3Auth();
  const { isAdmin } = useAdminCheck();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch profile image from our API
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!isConnected || !address) {
        setProfileImage(null);
        return;
      }

      try {
        const response = await fetch(`/api/users/${address}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.profileImage) {
            setProfileImage(data.data.profileImage);
          }
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, [isConnected, address]);

  // Sidebar items
  const baseSidebarItems: SidebarItem[] = [
    {
      id: 'profile' as SectionId,
      label: 'Sesión',
      labelConnected: 'Mi Cuenta',
      opensPanel: isConnected ? 'account' : 'auth',
      icon: <IconSesion size={30} color={brandConfig.colors.primary[600]} />,
    },
    {
      id: 'home',
      label: 'Inicio',
      icon: <IconHome size={30} color={brandConfig.colors.primary[600]} />,
    },
    {
      id: 'explore' as SectionId,
      label: 'Proyectos',
      icon: <IconProyectos size={30} color={brandConfig.colors.primary[600]} />,
    },
    {
      id: 'about',
      label: 'Respaldo',
      opensPanel: 'about',
      icon: <IconRespaldo size={30} color={brandConfig.colors.primary[600]} />,
    },
    {
      id: 'support',
      label: 'Soporte',
      opensPanel: 'contact',
      icon: <IconSoporte size={30} color={brandConfig.colors.primary[600]} />,
    },
  ];

  // Add admin item only if user is admin
  const sidebarItems: SidebarItem[] = isAdmin
    ? [
        ...baseSidebarItems,
        {
          id: 'admin' as SectionId,
          label: 'Admin',
          icon: <AdminIcon size={30} />,
        },
      ]
    : baseSidebarItems;

  // Mobile: show only main items (max 5)
  const mobileItems = sidebarItems.slice(0, 5);

  const handleItemClick = (item: SidebarItem) => {
    if (item.id === 'profile') {
      if (isConnected) {
        // Navigate to profile section instead of opening panel
        navigate('profile');
      } else {
        openPanel('auth');
      }
      return;
    }

    if (item.id === 'admin') {
      router.push('/admin');
      return;
    }

    if (item.opensPanel) {
      openPanel(item.opensPanel);
      return;
    }

    navigate(item.id);
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 flex-col items-center z-40">
        {/* Navigation Items - centered with padding to avoid IGJ badge overlap */}
        <nav className="flex flex-col items-center gap-4 flex-1 justify-center pb-40">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id;
            const isPanelOpen = item.opensPanel && activePanel === item.opensPanel;
            const isHovered = hoveredItem === item.id;
            const isUserItem = item.id === 'profile';

            const displayLabel = isUserItem && isConnected
              ? item.labelConnected || item.label
              : item.label;

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    'relative w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
                    // Figma style: circular background for icons
                    isUserItem && isConnected
                      ? 'border-0 bg-transparent'
                      : 'bg-primary-600/10 border border-primary-600/20',
                    isActive || isPanelOpen
                      ? 'bg-primary-600/20 border-primary-600/40 shadow-md'
                      : isHovered
                        ? 'bg-primary-600/15 border-primary-600/30'
                        : ''
                  )}
                  aria-label={displayLabel}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="relative z-10">
                    {isUserItem && isConnected ? (
                      <div className="relative">
                        <UserAvatar profileImage={profileImage} userInfo={userInfo} address={address} />
                        <ConnectedDot />
                      </div>
                    ) : (
                      item.icon
                    )}
                  </span>
                </button>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50"
                    >
                      <div className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-lg">
                        {displayLabel}
                        {isUserItem && isConnected && address && (
                          <div className="text-xs text-white/70 mt-0.5">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Logout button - Desktop */}
        {isConnected && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
            <button
              onClick={logout}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-10 h-10 rounded-full border border-red-300 text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-500 flex items-center justify-center transition-all"
              aria-label="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
            <AnimatePresence>
              {hoveredItem === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50"
                >
                  <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                    Cerrar Sesión
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Regulatory Badge - Desktop */}
        {brandConfig.features.showRegulatoryBadge && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-primary-600 rounded-lg flex items-center justify-center mb-1">
              <span className="text-primary-600 text-[10px] font-bold">{brandConfig.legal.regulatoryBadge.label}</span>
            </div>
            <div className="text-center">
              {brandConfig.legal.regulatoryBadge.lines.map((line, i) => (
                <p key={i} className="text-[8px] text-primary-600 font-semibold leading-tight">{line}</p>
              ))}
            </div>
            {/* App Version */}
            <p className="text-[9px] text-gray-400 mt-2">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 px-2 safe-area-pb">
        <div className="flex items-center justify-around h-full max-w-lg mx-auto">
          {mobileItems.map((item) => {
            const isActive = activeSection === item.id;
            const isPanelOpen = item.opensPanel && activePanel === item.opensPanel;
            const isUserItem = item.id === 'profile';

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all',
                  isActive || isPanelOpen
                    ? 'text-primary-600 bg-primary-600/5'
                    : 'text-gray-400 hover:text-primary-600'
                )}
                aria-label={item.label}
              >
                {isUserItem && isConnected ? (
                  <div className="relative">
                    <UserAvatar profileImage={profileImage} userInfo={userInfo} address={address} size="sm" />
                    <ConnectedDot size="sm" />
                  </div>
                ) : (
                  <span className="scale-75">
                    {item.icon}
                  </span>
                )}
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
