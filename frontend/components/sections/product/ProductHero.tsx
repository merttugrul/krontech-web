import Link from 'next/link';
import Image from 'next/image';
import type { Locale, ProductDetail } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { shouldBypassImageOptimization } from '@/lib/image-url';
import { localePrefix } from '@/lib/utils';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Icon } from '@/components/ui/Icon';

interface ProductHeroProps {
  product: ProductDetail;
  locale: Locale;
  dict: Dictionary;
}

/**
 * Ürün sayfasının hero/tepe bölgesi. Navbar fixed olduğu için `pt-28` ile
 * üstte boşluk. Sol sütun: breadcrumb + title + shortDescription + CTAs.
 * Sağ sütun: ogImage varsa ürünün kapak görseli; yoksa gradient placeholder.
 */
export function ProductHero({ product, locale, dict }: ProductHeroProps) {
  const prefix = localePrefix(locale);
  const p = dict.products;

  const breadcrumb: BreadcrumbItem[] = [
    { label: p.breadcrumbHome, href: prefix || '/' },
    { label: p.breadcrumbProducts, href: `${prefix}/products` },
    { label: product.title },
  ];

  return (
    <section className="relative overflow-hidden bg-kron-hero text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-1/3 h-[28rem] w-[28rem] rounded-full bg-kron-accent/20 blur-3xl"
      />

      <div className="container relative grid gap-12 py-20 pt-28 sm:py-24 sm:pt-32 lg:grid-cols-[1.2fr_1fr] lg:py-32 lg:pt-40">
        <div>
          <Breadcrumb items={breadcrumb} variant="white" className="mb-8" />

          {product.category ? (
            <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-light">
              {product.category.name}
            </span>
          ) : null}

          <h1 className="text-balance font-semibold text-white">
            {product.title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-slate-300">
            {product.shortDescription}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={`${prefix}/contact` as '/'}
              className="btn-primary text-base"
            >
              {p.heroCta}
              <Icon name="arrow-right" size={16} />
            </Link>
            <Link
              href={`${prefix}/contact` as '/'}
              className="btn-inverse text-base"
            >
              {p.heroSecondaryCta}
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-kron-blue via-kron-accent to-kron-light shadow-hero">
          {product.ogImage ? (
            <Image
              src={product.ogImage}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
              unoptimized={shouldBypassImageOptimization(product.ogImage)}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <span className="text-8xl font-semibold tracking-tight">
                {product.title.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
