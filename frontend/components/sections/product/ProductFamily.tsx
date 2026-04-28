import { sfetch } from '@/lib/api';
import type { Locale, ProductListItem } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { ProductCard } from '@/components/ui/ProductCard';

interface ProductFamilyProps {
  locale: Locale;
  slugs: string[];
  heading: string | undefined;
  defaultHeading: string;
  dict: Dictionary;
  /** Mevcut ürünün slug'ı — kendi kendini listelemesin. */
  currentSlug: string;
}

/**
 * Admin paneli `productFamily.slugs` → burada çözülüp kartlar olarak render.
 * `GET /api/products?locale=...` ile tüm listeyi çekip slug filtresi uyguluyoruz
 * (backend'de slug array filter henüz yok; 10-20 ürün için tek çağrı yeterli).
 *
 * Hiç eşleşme yoksa section render edilmez.
 */
export async function ProductFamilySection({
  locale,
  slugs,
  heading,
  defaultHeading,
  dict,
  currentSlug,
}: ProductFamilyProps) {
  const products = await fetchRelated(locale, slugs, currentSlug);
  if (products.length === 0) return null;

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">
          {heading ?? defaultHeading}
        </h2>

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
      </div>
    </section>
  );
}

async function fetchRelated(
  locale: Locale,
  slugs: string[],
  currentSlug: string,
): Promise<ProductListItem[]> {
  const wanted = new Set(slugs.filter((s) => s !== currentSlug));
  if (wanted.size === 0) return [];
  try {
    const all = await sfetch<ProductListItem[]>(`/products?locale=${locale}`, {
      tags: ['products'],
      revalidate: 300,
    });
    return all.filter((p) => wanted.has(p.slug));
  } catch {
    return [];
  }
}
