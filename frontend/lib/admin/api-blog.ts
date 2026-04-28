'use client';

import { adminApi } from './client';
import type {
  AdminBlogListItem,
  AdminBlogPost,
  AdminBlogTranslation,
  AdminPaginated,
  ContentStatus,
  FaqItem,
} from './types';
import type { PostType } from '@/lib/types';

export interface ListBlogParams {
  page?: number;
  pageSize?: number;
  status?: ContentStatus | 'all';
  type?: PostType | 'all';
  search?: string;
}

export interface CreateBlogPayload {
  slug?: string;
  type?: PostType;
  authorId?: string;
  coverImage?: string | null;
  status?: ContentStatus;
  scheduledAt?: string | null;
  isHighlight?: boolean;
  /** Slug boşken hangi dil başlığından üretileceği; UI primaryLocale ile aynı olmalı. */
  primaryLocale?: 'en' | 'tr';
  translations: Array<{
    locale: 'en' | 'tr';
    title: string;
    excerpt: string;
    content: string;
    faqItems?: FaqItem[];
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    noIndex?: boolean;
  }>;
}

export type UpdateBlogPayload = Partial<CreateBlogPayload>;

export async function listBlogPosts(
  params: ListBlogParams = {},
): Promise<AdminPaginated<AdminBlogListItem>> {
  const { status, type, ...rest } = params;
  const res = await adminApi.get<AdminPaginated<AdminBlogListItem>>('/admin/blog', {
    params: {
      ...rest,
      ...(status && status !== 'all' ? { status } : {}),
      ...(type && type !== 'all' ? { type } : {}),
    },
  });
  return {
    ...res.data,
    items: res.data.items.map(normalizeBlogListItem),
  };
}

export async function getBlogPost(id: string): Promise<AdminBlogPost> {
  const res = await adminApi.get<AdminBlogPost>(`/admin/blog/${id}`);
  return res.data;
}

export async function createBlogPost(
  payload: CreateBlogPayload,
): Promise<AdminBlogPost> {
  const res = await adminApi.post<AdminBlogPost>('/admin/blog', payload);
  return res.data;
}

export async function updateBlogPost(
  id: string,
  payload: UpdateBlogPayload,
): Promise<AdminBlogPost> {
  const res = await adminApi.patch<AdminBlogPost>(`/admin/blog/${id}`, payload);
  return res.data;
}

/** Tek dil çevirisi upsert — POST /admin/blog/:id/translations */
export async function upsertBlogTranslation(
  id: string,
  translation: CreateBlogPayload['translations'][number],
): Promise<AdminBlogPost> {
  const res = await adminApi.post<AdminBlogPost>(`/admin/blog/${id}/translations`, translation);
  return res.data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminApi.delete(`/admin/blog/${id}`);
}

export async function publishBlogPost(id: string): Promise<AdminBlogPost> {
  const res = await adminApi.post<AdminBlogPost>(`/admin/blog/${id}/publish`);
  return res.data;
}

export async function unpublishBlogPost(id: string): Promise<AdminBlogPost> {
  const res = await adminApi.post<AdminBlogPost>(`/admin/blog/${id}/unpublish`);
  return res.data;
}

export async function scheduleBlogPost(
  id: string,
  scheduledAt: string,
): Promise<AdminBlogPost> {
  const res = await adminApi.post<AdminBlogPost>(`/admin/blog/${id}/schedule`, {
    scheduledAt,
  });
  return res.data;
}

function normalizeBlogListItem(item: AdminBlogListItem): AdminBlogListItem {
  const raw = item as AdminBlogListItem & { translations?: AdminBlogTranslation[] };
  const title =
    item.title
    ?? raw.translations?.find((t) => t.locale === 'en')?.title
    ?? raw.translations?.find((t) => t.locale === 'tr')?.title
    ?? raw.translations?.[0]?.title
    ?? '';
  return { ...item, title };
}
