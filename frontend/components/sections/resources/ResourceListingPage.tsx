import Link from 'next/link';
import { sfetch } from '@/lib/api';
import type { Locale, Paginated, Resource, ResourceType } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { cn, localePrefix } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { ResourceCard } from '@/components/ui/ResourceCard';

interface ResourceListingPageProps {
  locale: Locale;
  page: number;
  typeFilter: ResourceType | null;
}

const PAGE_SIZE = 12;

/**
 * Kaynaklar listeleme sayfası. Blog listing'iyle benzer yapı:
 *  - Hero (koyu gradient) + breadcrumb + başlık.
 *  - Type filter tab'ları (All / Datasheets / Case studies / Whitepapers).
 *  - 12'li grid + paginate.
 *  - Fail-safe: backend erişilemezse empty state.
 */
export async function ResourceListingPage({
  locale,
  page,
  typeFilter,
}: ResourceListingPageProps) {
  const dict = getDictionary(locale);
  const r = dict.resources;
  const prefix = localePrefix(locale);
  const base = `${prefix}/resources`;

  const data = await fetchList(locale, page, typeFilter);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const filters: Array<{ key: ResourceType | null; label: string }> = [
    { key: null, label: r.filterAll },
    { key: 'datasheet', label: r.filterDatasheet },
    { key: 'casestudy', label: r.filterCasestudy },
    { key: 'whitepaper', label: r.filterWhitepaper },
  ];

  const filterClass =
    'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors';
  const activeFilter = 'bg-kron-accent text-white';
  const inactiveFilter =
    'border border-slate-200 bg-white text-kron-dark hover:border-kron-accent hover:text-kron-accent';

  const extraQuery = typeFilter ? `type=${typeFilter}` : undefined;

  return (
    <>
      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-16 sm:py-20">
          <Breadcrumb
            items={[
              { label: r.breadcrumbHome, href: prefix || '/' },
              { label: r.breadcrumbResources },
            ]}
            variant="white"
            className="mb-8"
          />
          <h1 className="text-balance font-semibold text-white">{r.title}</h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-slate-300">
            {r.subtitle}
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            {filters.map((f) => {
              const active = f.key === typeFilter;
              const href = f.key ? `${base}?type=${f.key}` : base;
              return (
                <Link
                  key={f.key ?? 'all'}
                  href={href as '/'}
                  className={cn(filterClass, active ? activeFilter : inactiveFilter)}
                  aria-pressed={active}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-kron-gray p-16 text-center">
              <h2 className="mb-2 text-xl font-semibold text-kron-dark">
                {r.emptyTitle}
              </h2>
              <p className="text-slate-600">{r.emptyDescription}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={base}
            extraQuery={extraQuery}
            labels={{
              prev: r.paginationPrev,
              next: r.paginationNext,
              page: r.paginationPage,
            }}
          />
        </div>
      </section>
    </>
  );
}

async function fetchList(
  locale: Locale,
  page: number,
  typeFilter: ResourceType | null,
): Promise<Paginated<Resource>> {
  try {
    const params = new URLSearchParams({
      locale,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (typeFilter) params.set('type', typeFilter);
    return await sfetch<Paginated<Resource>>(
      `/resources?${params.toString()}`,
      { tags: ['resources'], revalidate: 300 },
    );
  } catch {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE };
  }
}
