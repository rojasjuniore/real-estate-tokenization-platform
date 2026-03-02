'use client';

import { useState, useEffect } from 'react';
import { useWeb3Auth } from '@/lib/web3auth';

interface AdminCheckResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAdminCheck(): AdminCheckResult {
  const { address, isConnected } = useWeb3Auth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdmin = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[AdminCheck] Checking admin status for:', address);
        const response = await fetch('/api/admin/check', {
          headers: {
            'x-wallet-address': address,
          },
        });

        const data = await response.json();
        console.log('[AdminCheck] Response:', data);

        if (data.success) {
          console.log('[AdminCheck] isAdmin:', data.data.isAdmin);
          setIsAdmin(data.data.isAdmin);
        } else {
          setIsAdmin(false);
          setError(data.error?.message || 'Error checking admin status');
        }
      } catch (err) {
        console.error('[AdminCheck] Error:', err);
        setIsAdmin(false);
        setError('Failed to check admin status');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [address, isConnected]);

  return { isAdmin, isLoading, error };
}
