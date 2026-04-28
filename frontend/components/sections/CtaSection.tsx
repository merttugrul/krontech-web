import Link from 'next/link';
import type { Locale } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

interface CtaSectionProps {
  locale: Locale;
  dict: Dictionary;
}

/**
 * Sayfanın sonundaki kapanış CTA'sı. Hero'yla tonalite olarak eşleşsin
 * istiyoruz: koyu zemin + accent highlight.
 */
export function CtaSection({ locale, dict }: CtaSectionProps) {
  const prefix = localePrefix(locale);
  const h = dict.home;

  return (
    <section className="bg-kron-dark text-white">
      <div className="container py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-balance text-white">{h.ctaHeading}</h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-slate-300">
            {h.ctaSubheading}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href={`${prefix}/contact` as '/'} className="btn-primary text-base">
              {h.ctaPrimary}
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link href={`${prefix}/contact` as '/'} className="btn-inverse text-base">
              {h.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
