import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sfetch } from '@/lib/api';
import type { Locale, ProductDetail } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import {
  parseHowItWorks,
  parseKeyBenefits,
  parseProductFamily,
  parseSolution,
  parseVideos,
} from '@/lib/schemas/product-detail';
import { ProductHero } from './ProductHero';
import { ProductSolutionSection } from './ProductSolution';
import { ProductHowItWorksSection } from './ProductHowItWorks';
import { ProductKeyBenefitsSection } from './ProductKeyBenefits';
import { ProductVideosSection } from './ProductVideos';
import { ProductFamilySection } from './ProductFamily';
import { CtaSection } from '../CtaSection';
import { JsonLd } from '@/components/seo/JsonLd';

interface ProductDetailPageProps {
  slug: string;
  locale: Locale;
}

/**
 * EN ve TR ürün detay sayfalarının paylaştığı render'lanan ağaç.
 * Page dosyaları (`app/(site)/products/[slug]/page.tsx` ve
 * `app/tr/products/[slug]/page.tsx`) sadece slug + locale geçer, burası
 * tüm fetch/parse/render işini yapar.
 */
export async function ProductDetailPage({ slug, locale }: ProductDetailPageProps) {
  const product = await fetchProduct(slug, locale);
  if (!product) notFound();

  const dict = getDictionary(locale);
  const p = dict.products;

  const solution = parseSolution(product.solution);
  const howItWorks = parseHowItWorks(product.howItWorks);
  const keyBenefits = parseKeyBenefits(product.keyBenefits);
  const videos = parseVideos(product.videos);
  const family = parseProductFamily(product.productFamily);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const canonical = product.canonicalUrl
    ?? `${siteUrl}${localePrefix(locale)}/products/${product.slug}`;

  const productJsonLd: Record<string, unknown> | null = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.shortDescription,
        image: product.ogImage ?? undefined,
        brand: { '@type': 'Brand', name: 'Kron' },
        url: canonical,
        category: product.category?.name ?? undefined,
      }
    : null;

  const breadcrumbJsonLd: Record<string, unknown> | null = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: p.breadcrumbHome,
            item: `${siteUrl}${localePrefix(locale) || '/'}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: p.breadcrumbProducts,
            item: `${siteUrl}${localePrefix(locale)}/products`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.title,
          },
        ],
      }
    : null;

  return (
    <>
      {productJsonLd && breadcrumbJsonLd ? (
        <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      ) : null}
      <ProductHero product={product} locale={locale} dict={dict} />
      {solution ? (
        <ProductSolutionSection data={solution} defaultHeading={p.solutionDefaultHeading} />
      ) : null}
      {howItWorks ? (
        <ProductHowItWorksSection data={howItWorks} defaultHeading={p.howItWorksDefaultHeading} />
      ) : null}
      {keyBenefits ? (
        <ProductKeyBenefitsSection
          data={keyBenefits}
          defaultHeading={p.keyBenefitsDefaultHeading}
        />
      ) : null}
      {videos ? (
        <ProductVideosSection data={videos} defaultHeading={p.videosDefaultHeading} />
      ) : null}
      {family ? (
        <ProductFamilySection
          locale={locale}
          slugs={family.slugs}
          heading={family.heading}
          defaultHeading={p.productFamilyDefaultHeading}
          dict={dict}
          currentSlug={product.slug}
        />
      ) : null}
      <CtaSection locale={locale} dict={dict} />
    </>
  );
}

async function fetchProduct(slug: string, locale: Locale): Promise<ProductDetail | null> {
  try {
    return await sfetch<ProductDetail>(
      `/products/${encodeURIComponent(slug)}?locale=${locale}`,
      { tags: ['products', `product:${slug}`], revalidate: 300 },
    );
  } catch {
    return null;
  }
}

/**
 * `generateStaticParams` için slug listesi. Build sırasında backend'den
 * yayınlanmış ürünlerin slug'ları çekilir.
 *
 * Backend ulaşılamazsa boş dizi döner — Next.js on-demand SSR'a düşer
 * (dynamic params her iki page dosyasında `true` bırakılıyor).
 */
export async function listPublishedSlugs(locale: Locale): Promise<string[]> {
  try {
    const items = await sfetch<{ slug: string }[]>(
      `/products?locale=${locale}`,
      { tags: ['products'], revalidate: 300 },
    );
    return items.map((i) => i.slug);
  } catch {
    return [];
  }
}

/**
 * Sayfa `generateMetadata` için kullanışlı fetcher. Ürün yoksa fallback döner.
 */
export async function fetchProductForMetadata(
  slug: string,
  locale: Locale,
): Promise<ProductDetail | null> {
  return fetchProduct(slug, locale);
}

export function productNotFoundFallback(locale: Locale) {
  const dict = getDictionary(locale);
  const p = dict.products;
  const prefix = localePrefix(locale);
  return (
    <section className="section bg-kron-gray">
      <div className="container-tight text-center">
        <h1 className="mb-4 text-balance">{p.notFoundTitle}</h1>
        <p className="mb-8 text-pretty text-lg text-slate-600">
          {p.notFoundDescription}
        </p>
        <Link href={`${prefix}/products` as '/'} className="btn-primary">
          {p.notFoundCta}
        </Link>
      </div>
    </section>
  );
}
