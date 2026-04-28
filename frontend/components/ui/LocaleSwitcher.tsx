'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LocaleSwitcherProps {
  /** Navbar görsel varyantına göre kontrast. */
  variant?: 'dark' | 'white';
  className?: string;
}

/**
 * Mevcut URL'i koruyarak locale değiştirir.
 *   `/products/abc`       → `/tr/products/abc`
 *   `/tr/blog/slug`       → `/blog/slug`
 *   `/`                   → `/tr`
 *   `/tr`                 → `/`
 *
 * Router push yerine `<Link>` kullanıyoruz çünkü:
 *  - SEO: her iki versiyon arasında gezilebilir anchor (hreflang mantığı).
 *  - Keyboard: middle-click yeni sekmede açılabilir.
 */
export function LocaleSwitcher({ variant = 'dark', className }: LocaleSwitcherProps) {
  const pathname = usePathname() ?? '/';
  const { currentLocale, enHref, trHref } = computeHrefs(pathname);

  const baseBtn =
    'rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide transition-colors';
  const inactive =
    variant === 'white'
      ? 'text-white/60 hover:text-white'
      : 'text-slate-500 hover:text-kron-dark';
  const active =
    variant === 'white' ? 'text-white' : 'text-kron-dark';

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={cn('inline-flex items-center gap-1', className)}
    >
      <Link
        href={enHref as '/'}
        aria-current={currentLocale === 'en' ? 'page' : undefined}
        className={cn(baseBtn, currentLocale === 'en' ? active : inactive)}
      >
        EN
      </Link>
      <span aria-hidden className={variant === 'white' ? 'text-white/30' : 'text-slate-300'}>
        |
      </span>
      <Link
        href={trHref as '/tr'}
        aria-current={currentLocale === 'tr' ? 'page' : undefined}
        className={cn(baseBtn, currentLocale === 'tr' ? active : inactive)}
      >
        TR
      </Link>
    </div>
  );
}

/**
 * Saf fonksiyon — test edilebilir (aşağıdaki jest testleri bunu doğrular).
 * Export etmemizin tek sebebi unit test erişimi.
 */
export function computeHrefs(pathname: string): {
  currentLocale: Locale;
  enHref: string;
  trHref: string;
} {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/tr' || normalized.startsWith('/tr/')) {
    const rest = normalized.slice(3) || '/';
    return {
      currentLocale: 'tr',
      enHref: rest,
      trHref: normalized,
    };
  }
  const trHref = normalized === '/' ? '/tr' : `/tr${normalized}`;
  return {
    currentLocale: 'en',
    enHref: normalized,
    trHref,
  };
}
