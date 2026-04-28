import Link from 'next/link';
import { sfetch } from '@/lib/api';
import type { BlogListItem, Locale, Paginated, PostType } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { BlogCard } from '@/components/ui/BlogCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';

interface BlogListingPageProps {
  locale: Locale;
  type: PostType;
  page: number;
  highlightOnly: boolean;
}

const PAGE_SIZE = 12;

/**
 * Blog / Haberler listeleme sayfası. EN + TR paylaşılan renderer.
 *  - Hero: başlık + subtitle + filter link'leri
 *  - Grid: 12'li page (öne çıkanlar önce gösterilir — backend sıralar)
 *  - Pagination: link-based, SSG friendly
 *  - Breadcrumb: Home / Blog (veya News)
 */
export async function BlogListingPage({
  locale,
  type,
  page,
  highlightOnly,
}: BlogListingPageProps) {
  const dict = getDictionary(locale);
  const b = dict.blog;
  const prefix = localePrefix(locale);
  const base = type === 'blog' ? `${prefix}/blog` : `${prefix}/news`;

  const data = await fetchList(locale, type, page, highlightOnly);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const title = type === 'blog' ? b.blogTitle : b.newsTitle;
  const subtitle = type === 'blog' ? b.blogSubtitle : b.newsSubtitle;
  const breadcrumbLabel = type === 'blog' ? b.breadcrumbBlog : b.breadcrumbNews;

  const filterClass =
    'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors';
  const activeFilter = 'bg-kron-accent text-white';
  const inactiveFilter = 'border border-slate-200 bg-white text-kron-dark hover:border-kron-accent hover:text-kron-accent';

  return (
    <>
      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-16 sm:py-20">
          <Breadcrumb
            items={[
              { label: b.breadcrumbHome, href: prefix || '/' },
              { label: breadcrumbLabel },
            ]}
            variant="white"
            className="mb-8"
          />
          <h1 className="text-balance font-semibold text-white">{title}</h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-slate-300">
            {subtitle}
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Link
              href={base as '/'}
              className={cn(filterClass, !highlightOnly ? activeFilter : inactiveFilter)}
            >
              {b.filterAll}
            </Link>
            <Link
              href={`${base}?highlight=1` as '/'}
              className={cn(filterClass, highlightOnly ? activeFilter : inactiveFilter)}
            >
              {b.filterHighlight}
            </Link>
          </div>

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-kron-gray p-16 text-center">
              <h2 className="mb-2 text-xl font-semibold text-kron-dark">
                {b.emptyListTitle}
              </h2>
              <p className="text-slate-600">{b.emptyListDescription}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  locale={locale}
                  readMoreLabel={dict.common.readMore}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={base}
            extraQuery={highlightOnly ? 'highlight=1' : undefined}
            labels={{
              prev: b.paginationPrev,
              next: b.paginationNext,
              page: b.paginationPage,
            }}
          />
        </div>
      </section>
    </>
  );
}

async function fetchList(
  locale: Locale,
  type: PostType,
  page: number,
  highlightOnly: boolean,
): Promise<Paginated<BlogListItem>> {
  try {
    // /tr/blog, /tr/news → tr | /blog, /news (site EN) → en — backend /api/blog?locale=…
    const apiLocale: Locale = locale === 'tr' ? 'tr' : 'en';
    const params = new URLSearchParams();
    params.set('locale', apiLocale);
    params.set('type', type);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (highlightOnly) params.set('isHighlight', 'true');
    return await sfetch<Paginated<BlogListItem>>(
      `/blog?${params.toString()}`,
      { tags: ['blog'], revalidate: 300 },
    );
  } catch {
    return { items: [], total: 0, page, pageSize: PAGE_SIZE };
  }
}
