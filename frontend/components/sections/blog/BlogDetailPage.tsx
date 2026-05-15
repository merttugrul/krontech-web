import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sfetch } from '@/lib/api';
import type { BlogDetail, Locale, PostType, Paginated, BlogListItem } from '@/lib/types';
import { getDictionary } from '@/lib/i18n';
import { formatDate, localePrefix, readingTimeMinutes } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import { BlogArticle } from './BlogArticle';
import { BlogFaq } from './BlogFaq';
import { RelatedPosts } from './RelatedPosts';

interface BlogDetailPageProps {
  slug: string;
  locale: Locale;
  /** URL'den beklenen tip — `type=blog` ama response `news` ise 404. */
  expectedType: PostType;
}

/**
 * Blog / News detay sayfası için ortak composer. Hero → Article → FAQ → Related.
 * URL path'i (`/blog` vs `/news`) ile response'un `type`u uyuşmazsa notFound.
 */
export async function BlogDetailPage({
  slug,
  locale,
  expectedType,
}: BlogDetailPageProps) {
  const post = await fetchPost(slug, locale);
  if (!post) notFound();
  if (post.type !== expectedType) notFound();

  const dict = getDictionary(locale);
  const b = dict.blog;
  const prefix = localePrefix(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const basePath = expectedType === 'blog' ? `${prefix}/blog` : `${prefix}/news`;

  const readTime = readingTimeMinutes(post.content);
  const typeLabel = post.type === 'blog' ? b.typeBlog : b.typeNews;
  const breadcrumbLabel =
    post.type === 'blog' ? b.breadcrumbBlog : b.breadcrumbNews;

  const articleJsonLd: Record<string, unknown> | null = post
    ? {
        '@context': 'https://schema.org',
        '@type': post.type === 'news' ? 'NewsArticle' : 'Article',
        headline: post.title,
        description: post.metaDescription ?? post.excerpt,
        image: post.ogImage ?? post.coverImage ?? undefined,
        datePublished: post.publishedAt ?? undefined,
        dateModified: post.publishedAt ?? undefined,
        author: post.author
          ? [{ '@type': 'Person', name: post.author.email.split('@')[0] }]
          : [{ '@type': 'Organization', name: 'Kron' }],
        publisher: {
          '@type': 'Organization',
          name: 'Kron',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
        },
        mainEntityOfPage: `${siteUrl}${basePath}/${post.slug}`,
      }
    : null;

  const breadcrumbJsonLd: Record<string, unknown> | null = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: b.breadcrumbHome,
            item: `${siteUrl}${prefix || '/'}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: breadcrumbLabel,
            item: `${siteUrl}${basePath}`,
          },
          { '@type': 'ListItem', position: 3, name: post.title },
        ],
      }
    : null;

  return (
    <>
      {articleJsonLd && breadcrumbJsonLd ? (
        <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      ) : null}

      <section className="bg-kron-hero pt-28 text-white sm:pt-32">
        <div className="container py-16 sm:py-20">
          <Breadcrumb
            items={[
              { label: b.breadcrumbHome, href: prefix || '/' },
              { label: breadcrumbLabel, href: basePath },
              { label: post.title },
            ]}
            variant="white"
            className="mb-8"
          />
          <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-kron-light">
            {typeLabel}
          </span>
          <h1 className="max-w-4xl text-balance font-semibold text-white">
            {post.title}
          </h1>
          <p className="mt-4 max-w-3xl text-pretty text-lg text-slate-300">
            {post.excerpt}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
            {post.publishedAt ? (
              <span>
                {b.publishedOn}: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
              </span>
            ) : null}
            <span>{readTime} {b.minRead}</span>
            {post.author ? (
              <span>
                {b.authorBy}{' '}
                <span className="text-slate-200">
                  {post.author.email.split('@')[0]}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {post.coverImage ? (
        <section className="bg-white">
          <div className="container -mt-10 sm:-mt-14">
            <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl shadow-hero">
              <img
                src={post.coverImage}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="section bg-white">
        <div className="container-tight">
          <BlogArticle html={post.content} />
        </div>
      </section>

      {post.faqItems && post.faqItems.length > 0 ? (
        <BlogFaq items={post.faqItems} heading={b.faqHeading} />
      ) : null}

      <RelatedPosts
        locale={locale}
        type={post.type}
        currentSlug={post.slug}
        heading={b.relatedHeading}
        dict={dict}
      />
    </>
  );
}

async function fetchPost(slug: string, locale: Locale): Promise<BlogDetail | null> {
  try {
    return await sfetch<BlogDetail>(
      `/blog/${encodeURIComponent(slug)}?locale=${locale}`,
      { tags: ['blog', `blog:${slug}`], revalidate: 300 },
    );
  } catch {
    return null;
  }
}

export async function fetchPostForMetadata(
  slug: string,
  locale: Locale,
): Promise<BlogDetail | null> {
  return fetchPost(slug, locale);
}

/**
 * `generateStaticParams` için — sadece istenen type'taki yayınlanmış slug'ları
 * döner. Backend ulaşılamazsa boş dizi → on-demand SSR fallback.
 */
export async function listPublishedBlogSlugs(
  locale: Locale,
  type: PostType,
): Promise<string[]> {
  try {
    const res = await sfetch<Paginated<BlogListItem>>(
      `/blog?locale=${locale}&type=${type}&page=1&pageSize=50`,
      { tags: ['blog'], revalidate: 300 },
    );
    return res.items.map((i) => i.slug);
  } catch {
    return [];
  }
}

export function renderNotFound(locale: Locale, type: PostType) {
  const dict = getDictionary(locale);
  const b = dict.blog;
  const prefix = localePrefix(locale);
  const base = type === 'blog' ? `${prefix}/blog` : `${prefix}/news`;
  return (
    <section className="section bg-kron-gray">
      <div className="container-tight text-center">
        <h1 className="mb-4 text-balance">{b.notFoundTitle}</h1>
        <p className="mb-8 text-pretty text-lg text-slate-600">
          {b.notFoundDescription}
        </p>
        <Link href={base as '/'} className="btn-primary">
          {b.notFoundCta}
        </Link>
      </div>
    </section>
  );
}
