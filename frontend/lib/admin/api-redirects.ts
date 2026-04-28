'use client';

import { adminApi } from './client';
import type { AdminPaginated, AdminRedirect } from './types';

export interface ListRedirectsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateRedirectPayload {
  fromPath: string;
  toPath: string;
  statusCode?: 301 | 302;
  isActive?: boolean;
}

export type UpdateRedirectPayload = Partial<CreateRedirectPayload>;

export async function listRedirects(
  params: ListRedirectsParams = {},
): Promise<AdminPaginated<AdminRedirect>> {
  const res = await adminApi.get<AdminPaginated<AdminRedirect>>('/admin/redirects', {
    params,
  });
  return res.data;
}

export async function getRedirect(id: string): Promise<AdminRedirect> {
  const res = await adminApi.get<AdminRedirect>(`/admin/redirects/${id}`);
  return res.data;
}

export async function createRedirect(payload: CreateRedirectPayload): Promise<AdminRedirect> {
  const res = await adminApi.post<AdminRedirect>('/admin/redirects', payload);
  return res.data;
}

export async function updateRedirect(
  id: string,
  payload: UpdateRedirectPayload,
): Promise<AdminRedirect> {
  const res = await adminApi.patch<AdminRedirect>(`/admin/redirects/${id}`, payload);
  return res.data;
}

export async function deleteRedirect(id: string): Promise<void> {
  await adminApi.delete(`/admin/redirects/${id}`);
}
