import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Koyu hero üstünde kullanılırsa açık renk set eder. */
  variant?: 'dark' | 'white';
}

/**
 * Schema.org BreadcrumbList markup'ını inline olarak üreten küçük component.
 * Her item `<li>` içinde; son item (href yok) aktif sayfa — `aria-current`
 * set edilir.
 *
 * JSON-LD breadcrumb structured data, detay sayfasında ayrıca üretilir
 * (bkz. ADIM 18 SEO altyapısı).
 */
export function Breadcrumb({ items, className, variant = 'dark' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  const linkColor =
    variant === 'white'
      ? 'text-slate-300 hover:text-white'
      : 'text-slate-500 hover:text-kron-accent';
  const currentColor = variant === 'white' ? 'text-white' : 'text-kron-dark';
  const separatorColor = variant === 'white' ? 'text-slate-500' : 'text-slate-400';

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href as '/'} className={linkColor}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={currentColor}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <span aria-hidden className={separatorColor}>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
