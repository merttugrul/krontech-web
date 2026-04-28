'use client';

import { adminApi } from './client';
import type {
  AdminPaginated,
  AdminProduct,
  AdminProductListItem,
  AdminProductTranslation,
  AdminProductCategory,
  ContentStatus,
  ProductKind,
} from './types';

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  status?: ContentStatus | 'all';
  search?: string;
}

export interface CreateProductPayload {
  slug?: string;
  kind?: ProductKind;
  categoryId?: string | null;
  status?: ContentStatus;
  scheduledAt?: string | null;
  order?: number;
  translations: Array<{
    locale: 'en' | 'tr';
    title: string;
    shortDescription: string;
    solution?: unknown;
    howItWorks?: unknown;
    keyBenefits?: unknown;
    productFamily?: unknown;
    videos?: unknown;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    noIndex?: boolean;
    structuredData?: unknown;
  }>;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export async function listProducts(
  params: ListProductsParams = {},
): Promise<AdminPaginated<AdminProductListItem>> {
  const { status, ...rest } = params;
  const res = await adminApi.get<AdminPaginated<AdminProductListItem>>(
    '/admin/products',
    { params: { ...rest, ...(status && status !== 'all' ? { status } : {}) } },
  );
  return {
    ...res.data,
    items: res.data.items.map(normalizeProductListItem),
  };
}

export async function getProduct(id: string): Promise<AdminProduct> {
  const res = await adminApi.get<AdminProduct>(`/admin/products/${id}`);
  return res.data;
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<AdminProduct> {
  const res = await adminApi.post<AdminProduct>('/admin/products', payload);
  return res.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<AdminProduct> {
  const res = await adminApi.patch<AdminProduct>(`/admin/products/${id}`, payload);
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await adminApi.delete(`/admin/products/${id}`);
}

export async function publishProduct(id: string): Promise<AdminProduct> {
  const res = await adminApi.post<AdminProduct>(`/admin/products/${id}/publish`);
  return res.data;
}

export async function unpublishProduct(id: string): Promise<AdminProduct> {
  const res = await adminApi.post<AdminProduct>(`/admin/products/${id}/unpublish`);
  return res.data;
}

export async function scheduleProduct(
  id: string,
  scheduledAt: string,
): Promise<AdminProduct> {
  const res = await adminApi.post<AdminProduct>(`/admin/products/${id}/schedule`, {
    scheduledAt,
  });
  return res.data;
}

export async function listProductCategories(): Promise<AdminProductCategory[]> {
  const res = await adminApi.get<AdminProductCategory[]>('/admin/product-categories');
  return res.data;
}

function normalizeProductListItem(item: AdminProductListItem): AdminProductListItem {
  const raw = item as AdminProductListItem & {
    translations?: AdminProductTranslation[];
  };
  const title = item.title
    ?? raw.translations?.find((t) => t.locale === 'en')?.title
    ?? raw.translations?.[0]?.title
    ?? '';

  return {
    ...item,
    title,
    kind: item.kind ?? 'product',
  };
}
