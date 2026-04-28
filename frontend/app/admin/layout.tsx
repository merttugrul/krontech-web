import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Admin route group — marketing site `SiteShell`'ini kullanmaz, kendi
 * navigation/shell'i var.
 *
 * `AdminShell` client component olduğu için burası sadece metadata + pass
 * through. Auth kontrolü:
 *  1. Middleware (`middleware.ts`) cookie yoksa `/admin/login`'e redirect.
 *  2. AdminShell içinde `/auth/me` ile token doğrulaması + session bilgileri
 *     (sidebar'daki email/role için).
 *
 * `/admin/login` kendi layout'unu (veya bu layout'u) kullanır ama AdminShell
 * eklemez — login sayfasındayken sidebar/header olmasın.
 */
export const metadata: Metadata = {
  title: { default: 'Admin Panel', template: '%s · Krontech Admin' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
