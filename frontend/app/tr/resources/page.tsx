import type { Metadata } from 'next';
import { ResourceListingPage } from '@/components/sections/resources/ResourceListingPage';
import { getDictionary } from '@/lib/i18n';
import { parseResourceTypeParam } from '@/lib/resources';

const LOCALE = 'tr' as const;

interface SearchParams {
  page?: string;
  type?: string;
}

export const metadata: Metadata = {
  title: 'Kaynaklar · Krontech',
  description: getDictionary('tr').resources.subtitle,
  alternates: {
    canonical: '/tr/resources',
    languages: { en: '/resources', tr: '/tr/resources' },
  },
  openGraph: {
    title: 'Kaynaklar · Krontech',
    description: getDictionary('tr').resources.subtitle,
    url: '/tr/resources',
    locale: 'tr_TR',
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
