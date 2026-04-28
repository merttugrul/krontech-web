import Link from 'next/link';
import Image from 'next/image';
import type { Locale, ProductListItem } from '@/lib/types';
import { shouldBypassImageOptimization } from '@/lib/image-url';
import { localePrefix, truncate } from '@/lib/utils';
import { Icon } from './Icon';

interface ProductCardProps {
  product: ProductListItem;
  locale: Locale;
  ctaLabel: string;
}

/**
 * Ürün kartı — marketing grid ve Swiper slide'larında aynı kart kullanılır.
 *
 * `ogImage` yoksa gradient placeholder fallback. Hover'da card lift +
 * arrow offset (CTA'nın tıklanabilirliğini gözle hissetmek için).
 */
export function ProductCard({ product, locale, ctaLabel }: ProductCardProps) {
  const href = `${localePrefix(locale)}/products/${product.slug}`;

  return (
    <Link
      href={href as '/'}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kron-accent focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-kron-navy via-kron-blue to-kron-accent">
        {product.ogImage ? (
          <Image
            src={product.ogImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={shouldBypassImageOptimization(product.ogImage)}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            <span className="text-5xl font-semibold tracking-tight">
              {product.title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {product.category ? (
          <span className="mb-2 text-xs font-medium uppercase tracking-wider text-kron-accent">
            {product.category.name}
          </span>
        ) : null}
        <h3 className="mb-2 text-xl font-semibold text-kron-dark group-hover:text-kron-accent">
          {product.title}
        </h3>
        <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
          {truncate(product.shortDescription, 140)}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-kron-accent">
          {ctaLabel}
          <Icon
            name="arrow-right"
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
