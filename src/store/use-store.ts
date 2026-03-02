import { useState, useEffect } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * SSR-safe hook wrapper for Zustand stores
 * Prevents hydration mismatches by only updating state after mount
 */
export function useStore<T, F>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => F
): F {
  const result = store(selector);
  const [data, setData] = useState<F>(result);

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}
