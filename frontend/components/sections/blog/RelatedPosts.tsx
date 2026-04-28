import { sfetch } from '@/lib/api';
import type { BlogListItem, Locale, Paginated, PostType } from '@/lib/types';
import type { Dictionary } from '@/lib/i18n';
import { BlogCard } from '@/components/ui/BlogCard';

interface RelatedPostsProps {
  locale: Locale;
  type: PostType;
  currentSlug: string;
  heading: string;
  dict: Dictionary;
}

/**
 * Aynı `type` altında son 4 yayını çeker, mevcut slug'ı çıkarır,
 * ilk 3'ünü listeler. Hiç yoksa section render edilmez.
 */
export async function RelatedPosts({
  locale,
  type,
  currentSlug,
  heading,
  dict,
}: RelatedPostsProps) {
  const posts = await fetchRelated(locale, type, currentSlug);
  if (posts.length === 0) return null;

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="mb-12 text-center text-balance">{heading}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              locale={locale}
              readMoreLabel={dict.common.readMore}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

async function fetchRelated(
  locale: Locale,
  type: PostType,
  currentSlug: string,
): Promise<BlogListItem[]> {
  try {
    const res = await sfetch<Paginated<BlogListItem>>(
      `/blog?locale=${locale}&type=${type}&page=1&pageSize=4`,
      { tags: ['blog'], revalidate: 300 },
    );
    return res.items.filter((p) => p.slug !== currentSlug).slice(0, 3);
  } catch {
    return [];
  }
}
