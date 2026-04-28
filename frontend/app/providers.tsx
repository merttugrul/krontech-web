'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Tüm client-side data fetching React Query üzerinden gider.
 * - `staleTime: 60s` → aynı key için 1 dk içinde remount oldu mu, refetch etmez.
 * - `gcTime: 5m` → cache'te kalan data 5 dakika sonra GC edilir.
 * - `retry: 1` → network flake için 1 kez deneyerek hızlıca kullanıcıya hata göster.
 *
 * SSR tarafında Server Components fetch'leri bu provider'a dokunmaz; bu sadece
 * client component ağı için.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
