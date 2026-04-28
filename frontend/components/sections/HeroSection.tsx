import Link from 'next/link';
import type { Locale } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { Highlight } from '@/components/ui/Highlight';
import { Icon } from '@/components/ui/Icon';

interface HeroSectionProps {
  locale: Locale;
  dict: Dictionary;
}

/**
 * Ana sayfa hero'su. Navbar `fixed` olduğu için üstte 16h padding bırakıyoruz
 * (announcement bar varsa render edilmez — height tahmini yeterli; offset
 * kitini ADIM 18'de SEO refactor'ünde netleştiririz).
 *
 * Arka plan: `bg-kron-hero` gradient (koyu lacivert → dark). Küçük radial
 * highlight ile kurumsal "depth" — fazla dekoratif değil.
 */
export function HeroSection({ locale, dict }: HeroSectionProps) {
  const prefix = localePrefix(locale);
  const h = dict.home;

  return (
    <section className="relative overflow-hidden bg-kron-hero text-white">
      {/* Accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-kron-accent/20 blur-3xl"
      />

      <div className="container relative py-24 pt-32 sm:py-32 sm:pt-40 lg:py-40 lg:pt-48">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-kron-light">
            {h.heroEyebrow}
          </p>
          <h1 className="text-balance font-semibold text-white">
            {h.heroTitlePrefix}{' '}
            <Highlight>{h.heroTitleHighlight}</Highlight>
            <br className="hidden sm:block" />{' '}
            {h.heroTitleSuffix}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-300">
            {h.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`${prefix}/contact` as '/'}
              className="btn-primary text-base"
            >
              {h.heroPrimaryCta}
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link
              href={`${prefix}/products` as '/'}
              className="btn-inverse text-base"
            >
              {h.heroSecondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
