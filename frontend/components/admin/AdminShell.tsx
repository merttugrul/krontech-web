'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getCachedUser } from '@/lib/admin/session';
import { fetchMe } from '@/lib/admin/auth-api';
import type { AdminUser } from '@/lib/admin/auth-types';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Admin panel wrapper — sidebar + header + ana içerik gridi.
 *
 * Client component olmasının sebebi: cookie-based auth flow CSR tarafında
 * çalışıyor. Middleware cookie yoksa /admin/login'e atar; burada ekstra
 * olarak `/auth/me` ile backend doğrulaması yapıyoruz (token'ın revoke
 * edilmiş veya corrupt olma ihtimaline karşı).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(getCachedUser());
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    fetchMe()
      .then((me) => {
        if (!mounted) return;
        setUser(me);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        // Token expired/invalid — interceptor zaten redirect ediyor ama yedek
        router.replace('/admin/login');
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kron-light">
        <div className="flex flex-col items-center gap-3 text-kron-gray">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-kron-blue border-t-transparent" />
          <p className="text-sm">Yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-kron-light/40 text-kron-dark">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <TopBar user={user} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
