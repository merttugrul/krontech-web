import Link from 'next/link';
import { sfetch } from '@/lib/api';
import type { Locale, ProductListItem } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { ProductCard } from '@/components/ui/ProductCard';
import { Icon } from '@/components/ui/Icon';

interface ProductShowcaseProps {
  locale: Locale;
  dict: Dictionary;
  /** Ana sayfada ilk N ürün. Varsayılan 6. */
  limit?: number;
}

/**
 * Anasayfa ürün vitrini. `GET /api/products?locale=...` backend'den çekilir,
 * ilk `limit` öğe listelenir. Cache tag `products` — ürün
 * revalidate'lerinde otomatik güncellenir.
 *
 * Backend boş/hatalı dönerse dostane boş-state render edilir (sayfa çökmez).
 */
export async function ProductShowcase({
  locale,
  dict,
  limit = 6,
}: ProductShowcaseProps) {
  const products = await fetchProducts(locale, limit);
  const prefix = localePrefix(locale);
  const h = dict.home;

  return (
    <section className="section bg-kron-gray">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-balance">{h.productsHeading}</h2>
          <p className="text-pretty text-lg text-slate-600">
            {h.productsSubheading}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
            {h.productsEmpty}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                locale={locale}
                ctaLabel={dict.common.learnMore}
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href={`${prefix}/products` as '/'}
            className="btn-secondary text-base"
          >
            {h.productsCtaAll}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

async function fetchProducts(locale: Locale, limit: number): Promise<ProductListItem[]> {
  try {
    const res = await sfetch<ProductListItem[]>(
      `/products?locale=${locale}`,
      { tags: ['products'], revalidate: 300 },
    );
    return res.slice(0, limit);
  } catch {
    return [];
  }
}
