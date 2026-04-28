import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { sfetch } from '@/lib/api';
import type { Locale, Paginated, Resource } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { formatDate, localePrefix } from '@/lib/utils';
import { resourceTypeLabel } from '@/lib/resources';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ResourceCard } from '@/components/ui/ResourceCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Icon } from '@/components/ui/Icon';

interface ResourceDetailPageProps {
  id: string;
  locale: Locale;
}

/**
 * Kaynak detay sayfası:
 *  - Hero: breadcrumb + type badge + başlık + kısa açıklama.
 *  - Cover image + download CTA.
 *  - Description full (truncate yok).
 *  - Related resources (aynı type, 3 adet).
 *  - JSON-LD: `Article` (vaka analizleri için) + `BreadcrumbList`.
 *    Whitepaper/datasheet için de Article kabulü SEO'da en esnek shape.
 */
export async function ResourceDetailPage({ id, locale }: ResourceDetailPageProps) {
  const resource = await fetchResource(id, locale);
  if (!resource) notFound();

  const dict = getDictionary(locale);
  const r = dict.resources;
  const prefix = localePrefix(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const basePath = `${prefix}/resources`;
  const typeLabel = resourceTypeLabel(resource.type, dict);

  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: resource.title,
    description: resource.description ?? undefined,
    image: resource.coverImage ?? undefined,
    datePublished: resource.createdAt,
    dateModified: resource.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Kron',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: `${siteUrl}${basePath}/${resource.id}`,
    ...(resource.fileUrl ? { url: resource.fileUrl } : {}),
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: r.breadcrumbHome,
        item: `${siteUrl}${prefix || '/'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: r.breadcrumbResources,
        item: `${siteUrl}${basePath}`,
      },
      { '@type': 'ListItem', position: 3, name: resource.title },
    ],
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />

      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-16 sm:py-20">
          <Breadcrumb
            items={[
              { label: r.breadcrumbHome, href: prefix || '/' },
              { label: r.breadcrumbResources, href: basePath },
              { label: resource.title },
            ]}
            variant="white"
            className="mb-8"
          />

          <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-light">
            {typeLabel}
          </span>

          <h1 className="max-w-4xl text-balance font-semibold text-white">
            {resource.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <time dateTime={resource.createdAt}>
              {formatDate(resource.createdAt, locale)}
            </time>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {resource.fileUrl ? (
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn-primary text-base"
              >
                {r.downloadCta}
                <Icon name="arrow-right" size={16} className="rotate-90" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm text-slate-400">
                {r.noFile}
              </span>
            )}
            <Link href={basePath as '/'} className="btn-inverse text-base">
              {r.breadcrumbResources}
            </Link>
          </div>
        </div>
      </section>

      {resource.coverImage ? (
        <section className="bg-white">
          <div className="container -mt-10 sm:-mt-14">
            <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl shadow-hero">
              <Image
                src={resource.coverImage}
                alt={resource.title}
                fill
                sizes="(min-width: 1280px) 1200px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </section>
      ) : null}

      {resource.description ? (
        <section className="section bg-white">
          <div className="container-tight">
            <div className="prose prose-slate prose-lg max-w-none prose-headings:text-kron-dark prose-a:text-kron-accent">
              {resource.description.split(/\n{2,}/).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <RelatedResources
        locale={locale}
        type={resource.type}
        currentId={resource.id}
        heading={r.relatedHeading}
      />
    </>
  );
}

// ─────────────────────────────────────
// Related
// ─────────────────────────────────────

async function RelatedResources({
  locale,
  type,
  currentId,
  heading,
}: {
  locale: Locale;
  type: Resource['type'];
  currentId: string;
  heading: string;
}) {
  const dict = getDictionary(locale);
  const related = await fetchRelated(locale, type, currentId);
  if (related.length === 0) return null;
  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">{heading}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────
// Fetchers
// ─────────────────────────────────────

async function fetchResource(id: string, locale: Locale): Promise<Resource | null> {
  try {
    return await sfetch<Resource>(`/resources/${encodeURIComponent(id)}?locale=${locale}`, {
      tags: ['resources', `resource:${id}`],
      revalidate: 300,
    });
  } catch {
    return null;
  }
}

export async function fetchResourceForMetadata(
  id: string,
  locale: Locale,
): Promise<Resource | null> {
  return fetchResource(id, locale);
}

async function fetchRelated(
  locale: Locale,
  type: Resource['type'],
  currentId: string,
): Promise<Resource[]> {
  try {
    const res = await sfetch<Paginated<Resource>>(
      `/resources?locale=${locale}&type=${type}&page=1&pageSize=4`,
      { tags: ['resources'], revalidate: 300 },
    );
    return res.items.filter((r) => r.id !== currentId).slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * `generateStaticParams` için yayınlanmış kaynak ID'leri.
 * Backend kapalıysa boş dizi → Next.js on-demand SSR fallback.
 */
export async function listPublishedResourceIds(locale: Locale): Promise<string[]> {
  try {
    const res = await sfetch<Paginated<Resource>>(
      `/resources?locale=${locale}&page=1&pageSize=100`,
      { tags: ['resources'], revalidate: 300 },
    );
    return res.items.map((i) => i.id);
  } catch {
    return [];
  }
}
