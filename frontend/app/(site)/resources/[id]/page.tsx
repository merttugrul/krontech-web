import type { Metadata } from 'next';
import {
  ResourceDetailPage,
  fetchResourceForMetadata,
  listPublishedResourceIds,
} from '@/components/sections/resources/ResourceDetailPage';
import { localePrefix } from '@/lib/utils';

const LOCALE = 'en' as const;

interface Params {
  id: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await listPublishedResourceIds(LOCALE);
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const resource = await fetchResourceForMetadata(params.id, LOCALE);
  if (!resource) {
    return {
      title: 'Resource not found · Krontech',
      robots: { index: false, follow: false },
    };
  }
  const title = `${resource.title} · Krontech`;
  const description = resource.description ?? undefined;
  const path = `${localePrefix(LOCALE)}/resources/${resource.id}`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        en: `/resources/${resource.id}`,
        tr: `/tr/resources/${resource.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: 'article',
      images: resource.coverImage ? [{ url: resource.coverImage }] : undefined,
      locale: 'en_US',
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  return <ResourceDetailPage id={params.id} locale={LOCALE} />;
}
