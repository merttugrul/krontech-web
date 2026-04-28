import type { Metadata } from 'next';
import { BlogListingPage } from '@/components/sections/blog/BlogListingPage';
import { getDictionary } from '@/lib/i18n';

const LOCALE = 'en' as const;

interface SearchParams {
  page?: string;
  highlight?: string;
}

export const metadata: Metadata = {
  title: 'News · Krontech',
  description: getDictionary('en').blog.newsSubtitle,
  alternates: {
    canonical: '/news',
    languages: { en: '/news', tr: '/tr/news' },
  },
  openGraph: {
    title: 'News · Krontech',
    description: getDictionary('en').blog.newsSubtitle,
    url: '/news',
    locale: 'en_US',
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
