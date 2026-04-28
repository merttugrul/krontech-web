'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, type AdminDashboardStats } from '@/lib/admin/api-stats';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const { data, isLoading, isError } = useQuery<AdminDashboardStats>({
    queryKey: ['admin', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-kron-navy">Hoş geldiniz</h1>
        <p className="mt-1 text-sm text-kron-gray">
          Krontech içerik platformunun genel durumu.
        </p>
      </header>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          İstatistikler yüklenemedi. Backend erişilebilir olduğundan emin olun.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-700">
          İçerik
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ürünler & Çözümler"
            total={data?.products.total}
            accent="blue"
            loading={isLoading}
            href="/admin/products"
            breakdown={[
              { label: 'Yayında', value: data?.products.published },
              { label: 'Taslak', value: data?.products.draft },
              { label: 'Planlı', value: data?.products.scheduled },
            ]}
          />
          <StatCard
            label="Blog & Haberler"
            total={data?.blog.total}
            accent="accent"
            loading={isLoading}
            href="/admin/blog"
            breakdown={[
              { label: 'Yayında', value: data?.blog.published },
              { label: 'Taslak', value: data?.blog.draft },
              { label: 'Planlı', value: data?.blog.scheduled },
            ]}
          />
          <StatCard
            label="Kaynaklar"
            total={data?.resources.total}
            accent="navy"
            loading={isLoading}
            href="/admin/resources"
          />
          <StatCard
            label="Media Library"
            total={data?.media.total}
            accent="gray"
            loading={isLoading}
            href="/admin/media"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-700">
          Diğer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Form Submissions"
            total={data?.forms.total}
            accent="blue"
            loading={isLoading}
            href="/admin/forms"
          />
          <div className="rounded-xl border border-kron-light bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-kron-navy">Hızlı aksiyonlar</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/admin/products/new"
                className="btn-primary text-xs"
              >
                + Yeni ürün
              </Link>
              <Link
                href="/admin/blog/new"
                className="btn-secondary text-xs"
              >
                + Yeni blog yazısı
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  total: number | undefined;
  accent: 'blue' | 'accent' | 'navy' | 'gray';
  loading: boolean;
  href?: string;
  breakdown?: Array<{ label: string; value: number | undefined }>;
}

function StatCard({ label, total, accent, loading, href, breakdown }: StatCardProps) {
  const accentClass = {
    blue: 'from-kron-blue/10 to-kron-blue/0 text-kron-blue',
    accent: 'from-kron-accent/10 to-kron-accent/0 text-kron-accent',
    navy: 'from-kron-navy/10 to-kron-navy/0 text-kron-navy',
    gray: 'from-kron-gray/10 to-kron-gray/0 text-kron-gray',
  }[accent];

  const body = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-kron-light bg-white p-5 shadow-sm transition-shadow',
        href && 'hover:shadow-card',
      )}
    >
      <div
        aria-hidden
        className={cn(
          'absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-80',
          accentClass,
        )}
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-700">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-kron-navy">
          {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-kron-light" /> : total ?? 0}
        </p>
        {breakdown && (
          <ul className="mt-3 grid grid-cols-3 gap-2 border-t border-kron-light pt-3 text-[11px] text-gray-700">
            {breakdown.map((b) => (
              <li key={b.label}>
                <span className="block font-semibold text-kron-dark">
                  {loading ? '—' : b.value ?? 0}
                </span>
                <span className="uppercase tracking-wider">{b.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href as never} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
