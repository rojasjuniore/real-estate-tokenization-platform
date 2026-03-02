"use client";

import { ReactNode, useEffect, useState } from "react";

interface SafeHydrateProps {
  children: ReactNode;
}

/**
 * Wrapper component that prevents SSR hydration issues
 * by only rendering children after client-side mount
 */
export function SafeHydrate({ children }: SafeHydrateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, render nothing
  // This prevents hydration mismatches with Web3 providers
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
