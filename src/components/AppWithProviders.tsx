'use client';

import { AppShell } from '@/components/layout/spa/AppShell';

// Providers are now in the root layout (ClientProviders)
// This component just renders the AppShell
export function AppWithProviders() {
  return <AppShell />;
}
