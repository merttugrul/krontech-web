'use client';

import { adminApi } from './client';

export interface AdminDashboardStats {
  products: { total: number; published: number; draft: number; scheduled: number };
  blog: { total: number; published: number; draft: number; scheduled: number };
  resources: { total: number };
  media: { total: number };
  forms: { total: number };
}

/**
 * Dashboard istatistikleri — şimdilik mevcut list endpoint'lerinden
 * `pageSize=1` ile toplam sayıyı alıyoruz. Backend'de özel `/admin/stats`
 * endpoint'i eklemek daha verimli; ileride refactor edilebilir.
 */
export async function fetchDashboardStats(): Promise<AdminDashboardStats> {
  const [
    productsAll,
    productsPublished,
    productsDraft,
    productsScheduled,
    blogAll,
    blogPublished,
    blogDraft,
    blogScheduled,
    resourcesAll,
    mediaAll,
    formsAll,
  ] = await Promise.all([
    countEndpoint('/admin/products'),
    countEndpoint('/admin/products', { status: 'published' }),
    countEndpoint('/admin/products', { status: 'draft' }),
    countEndpoint('/admin/products', { status: 'scheduled' }),
    countEndpoint('/admin/blog'),
    countEndpoint('/admin/blog', { status: 'published' }),
    countEndpoint('/admin/blog', { status: 'draft' }),
    countEndpoint('/admin/blog', { status: 'scheduled' }),
    countEndpoint('/admin/resources'),
    countEndpoint('/admin/media'),
    countEndpoint('/admin/forms'),
  ]);

  return {
    products: {
      total: productsAll,
      published: productsPublished,
      draft: productsDraft,
      scheduled: productsScheduled,
    },
    blog: {
      total: blogAll,
      published: blogPublished,
      draft: blogDraft,
      scheduled: blogScheduled,
    },
    resources: { total: resourcesAll },
    media: { total: mediaAll },
    forms: { total: formsAll },
  };
}

async function countEndpoint(
  url: string,
  params: Record<string, string | number> = {},
): Promise<number> {
  try {
    const res = await adminApi.get<{ total: number }>(url, {
      params: { page: 1, pageSize: 1, ...params },
    });
    return res.data.total ?? 0;
  } catch {
    return 0;
  }
}
