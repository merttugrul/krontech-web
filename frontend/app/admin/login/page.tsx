import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Giriş',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-kron-navy via-kron-blue to-kron-accent p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <span className="text-xl font-bold">K</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Krontech Admin</h1>
          <p className="mt-1 text-sm text-white/70">İçerik yönetim panelinize giriş yapın</p>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-hero">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
