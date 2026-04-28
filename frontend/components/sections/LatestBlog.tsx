import Link from 'next/link';
import { sfetch } from '@/lib/api';
import type { BlogListItem, Locale, Paginated } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { localePrefix } from '@/lib/utils';
import { BlogCard } from '@/components/ui/BlogCard';
import { Icon } from '@/components/ui/Icon';

interface LatestBlogProps {
  locale: Locale;
  dict: Dictionary;
  /** Varsayılan 3. */
  limit?: number;
}

/**
 * Anasayfa "son içerikler" bloğu. Backend `/api/blog?locale=...&pageSize=3&type=blog`
 * publish tarihine göre sıralıdır. Draft/scheduled postlar burada görünmez.
 */
export async function LatestBlog({ locale, dict, limit = 3 }: LatestBlogProps) {
  const posts = await fetchBlog(locale, limit);
  const prefix = localePrefix(locale);
  const h = dict.home;

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-balance">{h.latestBlogHeading}</h2>
          <p className="text-pretty text-lg text-slate-600">
            {h.latestBlogSubheading}
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-kron-gray px-6 py-10 text-center text-slate-500">
            {h.latestBlogEmpty}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <BlogCard
                key={p.id}
                post={p}
                locale={locale}
                readMoreLabel={dict.common.readMore}
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link href={`${prefix}/blog` as '/'} className="btn-secondary text-base">
            {h.latestBlogCtaAll}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

async function fetchBlog(locale: Locale, limit: number): Promise<BlogListItem[]> {
  try {
    const res = await sfetch<Paginated<BlogListItem>>(
      `/blog?locale=${locale}&type=blog&page=1&pageSize=${limit}`,
      { tags: ['blog'], revalidate: 300 },
    );
    return res.items;
  } catch {
    return [];
  }
}
