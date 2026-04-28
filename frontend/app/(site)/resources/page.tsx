import type { Metadata } from 'next';
import { ResourceListingPage } from '@/components/sections/resources/ResourceListingPage';
import { getDictionary } from '@/lib/i18n';
import { parseResourceTypeParam } from '@/lib/resources';

const LOCALE = 'en' as const;

interface SearchParams {
  page?: string;
  type?: string;
}

export const metadata: Metadata = {
  title: 'Resources · Krontech',
  description: getDictionary('en').resources.subtitle,
  alternates: {
    canonical: '/resources',
    languages: { en: '/resources', tr: '/tr/resources' },
  },
  openGraph: {
    title: 'Resources · Krontech',
    description: getDictionary('en').resources.subtitle,
    url: '/resources',
    locale: 'en_US',
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const typeFilter = parseResourceTypeParam(searchParams.type);
  return (
    <ResourceListingPage locale={LOCALE} page={page} typeFilter={typeFilter} />
  );
}
