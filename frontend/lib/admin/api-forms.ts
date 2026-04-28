'use client';

import { adminApi } from './client';
import type { AdminFormSubmission, AdminPaginated, FormType } from './types';

export interface ListFormSubmissionsParams {
  page?: number;
  pageSize?: number;
  formType?: FormType;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export async function listFormSubmissions(
  params: ListFormSubmissionsParams = {},
): Promise<AdminPaginated<AdminFormSubmission>> {
  const res = await adminApi.get<AdminPaginated<AdminFormSubmission>>('/admin/forms', {
    params,
  });
  return res.data;
}

/**
 * Mevcut filtreyle tüm sayfaları çeker (CSV export vb. için; max pageSize=100).
 */
export async function listAllFormSubmissions(
  params: Omit<ListFormSubmissionsParams, 'page' | 'pageSize'>,
): Promise<AdminFormSubmission[]> {
  const pageSize = 100;
  const all: AdminFormSubmission[] = [];
  let page = 1;
  for (;;) {
    const res = await listFormSubmissions({ ...params, page, pageSize });
    all.push(...res.items);
    if (res.items.length < pageSize || all.length >= res.total) break;
    page += 1;
  }
  return all;
}

export async function getFormSubmission(id: string): Promise<AdminFormSubmission> {
  const res = await adminApi.get<AdminFormSubmission>(`/admin/forms/${id}`);
  return res.data;
}

export async function deleteFormSubmission(id: string): Promise<void> {
  await adminApi.delete(`/admin/forms/${id}`);
}
