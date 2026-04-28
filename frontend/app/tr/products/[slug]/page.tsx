import type { Metadata } from 'next';
import {
  ProductDetailPage,
  fetchProductForMetadata,
  listPublishedSlugs,
} from '@/components/sections/product/ProductDetailPage';
import { localePrefix } from '@/lib/utils';

const LOCALE = 'tr' as const;

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listPublishedSlugs(LOCALE);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Params },
): Promise<Metadata> {
  const product = await fetchProductForMetadata(params.slug, LOCALE);
  if (!product) {
    return { title: 'Ürün bulunamadı · Krontech', robots: { index: false, follow: false } };
  }

  const title = product.metaTitle ?? `${product.title} · Krontech`;
  const description = product.metaDescription ?? product.shortDescription;
  const path = `${localePrefix(LOCALE)}/products/${product.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: product.canonicalUrl ?? path,
      languages: {
        en: `/products/${product.slug}`,
        tr: `/tr/products/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: 'article',
      images: product.ogImage ? [{ url: product.ogImage }] : undefined,
      locale: 'tr_TR',
    },
    robots: product.noIndex ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ params }: { params: Params }) {
  return <ProductDetailPage slug={params.slug} locale={LOCALE} />;
}
