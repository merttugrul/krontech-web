import type { Metadata } from 'next';
import {
  BlogDetailPage,
  fetchPostForMetadata,
  listPublishedBlogSlugs,
} from '@/components/sections/blog/BlogDetailPage';
import { localePrefix } from '@/lib/utils';

const LOCALE = 'en' as const;
const TYPE = 'news' as const;

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listPublishedBlogSlugs(LOCALE, TYPE);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const post = await fetchPostForMetadata(params.slug, LOCALE);
  if (!post || post.type !== TYPE) {
    return { title: 'News not found · Krontech', robots: { index: false, follow: false } };
  }
  const title = post.metaTitle ?? `${post.title} · Krontech`;
  const description = post.metaDescription ?? post.excerpt;
  const path = `${localePrefix(LOCALE)}/news/${post.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: post.canonicalUrl ?? path,
      languages: {
        en: `/news/${post.slug}`,
        tr: `/tr/news/${post.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: 'article',
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
      publishedTime: post.publishedAt ?? undefined,
      locale: 'en_US',
    },
    robots: post.noIndex ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ params }: { params: Params }) {
  return <BlogDetailPage slug={params.slug} locale={LOCALE} expectedType={TYPE} />;
}
