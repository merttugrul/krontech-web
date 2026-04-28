import type { Metadata } from 'next';
import { sfetch } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import type { Locale, ProductListItem } from '@/lib/types';
import { localePrefix } from '@/lib/utils';
import { ProductCard } from '@/components/ui/ProductCard';

type ListingKind = 'products' | 'solutions';

interface ProductListingPageProps {
  locale: Locale;
  kind: ListingKind;
}

const copy = {
  en: {
    products: {
      title: 'Products',
      description:
        'Explore Kron products for privileged access, telemetry, audit and observability workflows.',
      eyebrow: 'Product catalog',
    },
    solutions: {
      title: 'Solutions',
      description:
        'Find the Kron capabilities that help teams secure privileged access and operate critical telemetry pipelines.',
      eyebrow: 'Solution areas',
    },
  },
  tr: {
    products: {
      title: 'Ürünler',
      description:
        'Ayrıcalıklı erişim, telemetri, denetim ve gözlemlenebilirlik akışları için Kron ürünlerini keşfedin.',
      eyebrow: 'Ürün kataloğu',
    },
    solutions: {
      title: 'Çözümler',
      description:
        'Ayrıcalıklı erişimi güvenceye alan ve kritik telemetri pipeline’larını işleten Kron yeteneklerini keşfedin.',
      eyebrow: 'Çözüm alanları',
    },
  },
} satisfies Record<Locale, Record<ListingKind, { title: string; description: string; eyebrow: string }>>;

export function productListingMetadata(locale: Locale, kind: ListingKind): Metadata {
  const page = copy[locale][kind];
  const prefix = localePrefix(locale);
  const path = `${prefix}/${kind}` || `/${kind}`;

  return {
    title: `${page.title} · Krontech`,
    description: page.description,
    alternates: {
      canonical: path,
      languages: {
        en: `/${kind}`,
        tr: `/tr/${kind}`,
      },
    },
  };
}

export async function ProductListingPage({ locale, kind }: ProductListingPageProps) {
  const dict = getDictionary(locale);
  const page = copy[locale][kind];
  const products = await fetchProducts(locale, kind);

  return (
    <main>
      <section className="section bg-gradient-to-br from-kron-navy via-kron-blue to-kron-dark text-white">
        <div className="container-tight text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-kron-accent">
            {page.eyebrow}
          </p>
          <h1 className="mb-5 text-balance text-white">{page.title}</h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-white/80">
            {page.description}
          </p>
        </div>
      </section>

      <section className="section bg-kron-gray">
        <div className="container">
          {products.length === 0 ? (
            <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
              {dict.home.productsEmpty}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  ctaLabel={dict.common.learnMore}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function listingKindToApi(kind: ListingKind): 'product' | 'solution' {
  return kind === 'solutions' ? 'solution' : 'product';
}

async function fetchProducts(locale: Locale, kind: ListingKind): Promise<ProductListItem[]> {
  const k = listingKindToApi(kind);
  try {
    return await sfetch<ProductListItem[]>(
      `/products?locale=${locale}&kind=${k}`,
      { tags: ['products'], revalidate: 0 },
    );
  } catch {
    return [];
  }
}
