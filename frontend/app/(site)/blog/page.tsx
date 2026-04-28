import type { Metadata } from 'next';
import { BlogListingPage } from '@/components/sections/blog/BlogListingPage';
import { getDictionary } from '@/lib/i18n';

const LOCALE = 'en' as const;

interface SearchParams {
  page?: string;
  highlight?: string;
}

export const metadata: Metadata = {
  title: 'Blog · Krontech',
  description:
    'Deep dives on privileged access, observability and telemetry engineering — written by the Kron team.',
  alternates: {
    canonical: '/blog',
    languages: { en: '/blog', tr: '/tr/blog' },
  },
  openGraph: {
    title: 'Blog · Krontech',
    description: getDictionary('en').blog.blogSubtitle,
    url: '/blog',
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
      type="blog"
      page={page}
      highlightOnly={highlightOnly}
    />
  );
}
