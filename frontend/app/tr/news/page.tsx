import type { Metadata } from 'next';
import { BlogListingPage } from '@/components/sections/blog/BlogListingPage';
import { getDictionary } from '@/lib/i18n';

const LOCALE = 'tr' as const;

interface SearchParams {
  page?: string;
  highlight?: string;
}

export const metadata: Metadata = {
  title: 'Haberler · Krontech',
  description: getDictionary('tr').blog.newsSubtitle,
  alternates: {
    canonical: '/tr/news',
    languages: { en: '/news', tr: '/tr/news' },
  },
  openGraph: {
    title: 'Haberler · Krontech',
    description: getDictionary('tr').blog.newsSubtitle,
    url: '/tr/news',
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
      type="news"
      page={page}
      highlightOnly={highlightOnly}
    />
  );
}
