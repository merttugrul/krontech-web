import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/types';

interface LogoProps {
  locale: Locale;
  className?: string;
  /** `white` → koyu hero'larda, `dark` → beyaz navbar'da kullanılır. */
  variant?: 'dark' | 'white';
}

/**
 * Placeholder logo — gerçek SVG ADIM 13'te PLAN.md brand asset'leri geldiğinde
 * eklenir. Şimdilik `kron` wordmark + accent nokta.
 *
 * Link'i aktif locale'in anasayfasına atıyor — `/` veya `/tr`.
 */
export function Logo({ locale, className, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-kron-dark';
  const dotColor = 'text-kron-accent';
  const home = locale === 'tr' ? '/tr' : '/';

  return (
    <Link
      href={home}
      aria-label="Krontech"
      className={cn(
        'inline-flex items-baseline gap-0.5 text-xl font-semibold tracking-tight',
        textColor,
        className,
      )}
    >
      <span>kron</span>
      <span className={dotColor}>.</span>
      <span className="sr-only">Krontech</span>
    </Link>
  );
}
