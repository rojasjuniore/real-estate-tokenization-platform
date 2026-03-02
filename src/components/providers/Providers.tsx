"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Web3AuthProvider } from "@/lib/web3auth";
import { config } from "@/lib/web3/config";

// Create a single QueryClient instance for the entire app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Check if running on server - render children without providers
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3AuthProvider>
          {children}
        </Web3AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
