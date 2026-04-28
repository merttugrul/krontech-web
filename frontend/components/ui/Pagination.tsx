import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Base path — örn. `/blog` ya da `/tr/news`. Query string otomatik eklenir. */
  basePath: string;
  /** Sayfa query parametresi haricinde korunacak query string (örn. `type=blog`). */
  extraQuery?: string;
  labels: {
    prev: string;
    next: string;
    page: string;
  };
}

/**
 * Sayfa numaralı link-based pagination. SSG ile uyumlu — `Link` kullanır,
 * client state tutmaz. Görünen sayfa: `currentPage ± 1` + ilk/son + ellipsis.
 */
export function Pagination({
  currentPage,
  totalPages,
  basePath,
  extraQuery,
  labels,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number): string => {
    const params = new URLSearchParams(extraQuery ?? '');
    if (page > 1) params.set('page', String(page));
    else params.delete('page');
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = computeVisiblePages(currentPage, totalPages);

  const linkClass =
    'inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-md px-3 text-sm font-medium transition-colors';
  const active = 'bg-kron-accent text-white';
  const inactive = 'border border-slate-200 bg-white text-kron-dark hover:border-kron-accent hover:text-kron-accent';
  const disabled = 'pointer-events-none opacity-40';

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, currentPage - 1)) as '/'}
        aria-disabled={currentPage === 1}
        className={cn(linkClass, inactive, currentPage === 1 && disabled)}
        rel="prev"
      >
        <Icon name="arrow-right" size={14} className="rotate-180" />
        <span className="ml-1 hidden sm:inline">{labels.prev}</span>
      </Link>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            aria-hidden
            className="px-2 text-sm text-slate-400"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p) as '/'}
            aria-current={p === currentPage ? 'page' : undefined}
            aria-label={`${labels.page} ${p}`}
            className={cn(linkClass, p === currentPage ? active : inactive)}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1)) as '/'}
        aria-disabled={currentPage === totalPages}
        className={cn(linkClass, inactive, currentPage === totalPages && disabled)}
        rel="next"
      >
        <span className="mr-1 hidden sm:inline">{labels.next}</span>
        <Icon name="arrow-right" size={14} />
      </Link>
    </nav>
  );
}

/**
 * `[1, 2, '…', 5, 6, 7, '…', 20]` gibi ekran-friendly bir dizi döner.
 * Kurallar:
 *  - İlk sayfa hep görünür
 *  - Son sayfa hep görünür
 *  - Mevcut sayfa ± 1 görünür
 *  - Arada boşluk varsa ellipsis
 */
export function computeVisiblePages(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: Array<number | '…'> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) result.push('…');
  for (let p = left; p <= right; p++) result.push(p);
  if (right < total - 1) result.push('…');

  result.push(total);
  return result;
}
