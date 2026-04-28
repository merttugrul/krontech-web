import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

/**
 * Protected admin layout — sidebar + topbar wrap'li. Tüm CRUD sayfaları bunu
 * kullanır. `app/admin/login` bu route group'un dışında kaldığı için shell'siz
 * çıplak login UI'ı render eder.
 *
 * Route group yapısı:
 *   app/admin/
 *   ├── layout.tsx              (minimal, robots:noindex)
 *   ├── login/page.tsx          (public)
 *   └── (protected)/
 *       ├── layout.tsx          (AdminShell wrapper)
 *       ├── page.tsx            (dashboard)
 *       ├── products/...
 *       └── blog/...
 */
export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
