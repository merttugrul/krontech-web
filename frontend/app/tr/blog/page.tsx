import type { Metadata } from 'next';
import { BlogListingPage } from '@/components/sections/blog/BlogListingPage';
import { getDictionary } from '@/lib/i18n';

const LOCALE = 'tr' as const;

/** Liste silme/yayın sonrası anında güncellensin (ISR süresiz önbellek yok). */
export const revalidate = 0;

interface SearchParams {
  page?: string;
  highlight?: string;
}

export const metadata: Metadata = {
  title: 'Blog · Krontech',
  description: getDictionary('tr').blog.blogSubtitle,
  alternates: {
    canonical: '/tr/blog',
    languages: { en: '/blog', tr: '/tr/blog' },
  },
  openGraph: {
    title: 'Blog · Krontech',
    description: getDictionary('tr').blog.blogSubtitle,
    url: '/tr/blog',
    locale: 'tr_TR',
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const highlightOnly = searchParams.highlight === '1';
  return (
    <BlogListingPage
      locale={LOCALE}
      type="blog"
      page={page}
      highlightOnly={highlightOnly}
    />
  );
}
