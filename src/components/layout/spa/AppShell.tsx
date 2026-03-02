'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useNavigationStore, type SectionId } from '@/store';
import { usePanelsStore } from '@/store';
import { usePropertyStore } from '@/store';
import { ContactPanel } from '@/components/panels/ContactPanel';
import { HomeSection } from '@/components/sections/home/HomeSection';
import { ExploreSection } from '@/components/sections/explore/ExploreSection';
import { ExploreProjectsSection } from '@/components/sections/explore-projects/ExploreProjectsSection';
import { AboutSection } from '@/components/sections/about/AboutSection';
import { SupportSection } from '@/components/sections/support/SupportSection';
import { ProfileSection } from '@/components/sections/profile/ProfileSection';
import { AdminSection } from '@/components/sections/admin/AdminSection';
import { Footer } from './Footer';

// Dynamic imports to avoid SSR issues with Framer Motion and Web3
const Sidebar = dynamic(() => import('./Sidebar').then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200" />,
});
const SlidePanel = dynamic(() => import('./SlidePanel').then(mod => ({ default: mod.SlidePanel })), {
  ssr: false,
});
const AuthPanel = dynamic(() => import('@/components/panels/AuthPanel').then(mod => ({ default: mod.AuthPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});
const KYCPanel = dynamic(() => import('@/components/panels/KYCPanel').then(mod => ({ default: mod.KYCPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});
const AccountPanel = dynamic(() => import('@/components/panels/AccountPanel').then(mod => ({ default: mod.AccountPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});
const PropertyDetailPanel = dynamic(() => import('@/components/panels/PropertyDetailPanel').then(mod => ({ default: mod.PropertyDetailPanel })), {
  ssr: false,
});
const AboutPanel = dynamic(() => import('@/components/panels/AboutPanel').then(mod => ({ default: mod.AboutPanel })), {
  ssr: false,
});
const PortfolioPanel = dynamic(() => import('@/components/panels/PortfolioPanel').then(mod => ({ default: mod.PortfolioPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});
const DividendsPanel = dynamic(() => import('@/components/panels/DividendsPanel').then(mod => ({ default: mod.DividendsPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});
const SettingsPanel = dynamic(() => import('@/components/panels/SettingsPanel').then(mod => ({ default: mod.SettingsPanel })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-pulse text-gray-400">Cargando...</div></div>,
});

function renderSection(sectionId: SectionId) {
  switch (sectionId) {
    case 'home':
      return <HomeSection />;
    case 'explore':
      return <ExploreProjectsSection />;
    case 'marketplace':
      return <ExploreSection />;
    case 'about':
      return <AboutSection />;
    case 'support':
      return <SupportSection />;
    case 'profile':
      return <ProfileSection />;
    case 'admin':
      return <AdminSection />;
    default:
      return <HomeSection />;
  }
}

function renderPanelContent(activePanel: string | null) {
  switch (activePanel) {
    case 'auth':
      return <AuthPanel />;
    case 'contact':
      return <ContactPanel />;
    case 'kyc':
      return <KYCPanel />;
    case 'account':
      return <AccountPanel />;
    case 'portfolio':
      return <PortfolioPanel />;
    case 'dividends':
      return <DividendsPanel />;
    case 'settings':
      return <SettingsPanel />;
    // 'about' panel now uses AboutPanel (80% width) rendered separately
    default:
      return null;
  }
}

export function AppShell() {
  const { activeSection, navigate } = useNavigationStore();
  const { activePanel } = usePanelsStore();
  const { isModalOpen } = usePropertyStore();
  const [mounted, setMounted] = useState(false);

  // Handle URL hash on mount and popstate - combined into single effect
  useEffect(() => {
    setMounted(true);

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as SectionId;
      if (hash && ['home', 'explore', 'marketplace', 'about', 'support', 'profile', 'admin'].includes(hash)) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => navigate(hash), 0);
      }
    };

    // Initial check
    handleHashChange();

    // Listen for browser back/forward
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - offset by sidebar on desktop, full width on mobile */}
      <main className="md:ml-20 flex-1 flex flex-col pb-16 md:pb-0">
        <div className="flex-1">
          {renderSection(activeSection)}
        </div>

        {/* Footer - visible on all pages */}
        <Footer />
      </main>

      {/* Slide Panel - renders all panel types */}
      {mounted && (
        <SlidePanel>
          {renderPanelContent(activePanel)}
        </SlidePanel>
      )}

      {/* Property Detail Panel */}
      {mounted && isModalOpen && <PropertyDetailPanel />}

      {/* About Panel - 80% width */}
      {mounted && <AboutPanel />}
    </div>
  );
}
