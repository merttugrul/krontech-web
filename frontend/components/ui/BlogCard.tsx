import Link from 'next/link';
import type { BlogListItem, Locale } from '@/lib/types';
import { formatDate, localePrefix, truncate } from '@/lib/utils';
import { Icon } from './Icon';

interface BlogCardProps {
  post: BlogListItem;
  locale: Locale;
  readMoreLabel: string;
}

/**
 * Blog liste/anasayfa kartı. Cover image yoksa gradient placeholder;
 * `publishedAt` `null` ise tarih satırı gizlenir (draft/scheduled fallback).
 */
export function BlogCard({ post, locale, readMoreLabel }: BlogCardProps) {
  const href = `${localePrefix(locale)}/blog/${post.slug}`;

  return (
    <Link
      href={href as '/'}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kron-accent focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-900 via-kron-blue to-kron-accent">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="object-cover w-full h-full"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-kron-50 px-2 py-0.5 font-medium uppercase tracking-wider text-kron-accent">
            {post.type}
          </span>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt, locale)}
            </time>
          ) : null}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-kron-dark group-hover:text-kron-accent">
          {post.title}
        </h3>
        <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-600">
          {truncate(post.excerpt, 140)}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-kron-accent">
          {readMoreLabel}
          <Icon
            name="arrow-right"
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
