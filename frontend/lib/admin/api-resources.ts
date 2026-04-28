'use client';

import { adminApi } from './client';
import type {
  AdminPaginated,
  AdminResource,
  ContentStatus,
  ResourceType,
} from './types';

export interface ListResourcesParams {
  page?: number;
  pageSize?: number;
  status?: ContentStatus;
  type?: ResourceType;
  locale?: 'en' | 'tr';
  search?: string;
}

export interface CreateResourcePayload {
  type: ResourceType;
  productId?: string;
  coverImage?: string;
  fileUrl: string;
  locale?: 'en' | 'tr';
  title: string;
  description?: string;
  status?: 'draft' | 'published';
  order?: number;
}

/** PATCH: `productId: null` ürün bağını kaldırır. */
export type UpdateResourcePayload = Omit<Partial<CreateResourcePayload>, 'productId'> & {
  productId?: string | null;
};

export async function listResources(
  params: ListResourcesParams = {},
): Promise<AdminPaginated<AdminResource>> {
  const res = await adminApi.get<AdminPaginated<AdminResource>>('/admin/resources', {
    params,
  });
  return res.data;
}

export async function getResource(id: string): Promise<AdminResource> {
  const res = await adminApi.get<AdminResource>(`/admin/resources/${id}`);
  return res.data;
}

export async function createResource(payload: CreateResourcePayload): Promise<AdminResource> {
  const res = await adminApi.post<AdminResource>('/admin/resources', payload);
  return res.data;
}

export async function updateResource(
  id: string,
  payload: UpdateResourcePayload,
): Promise<AdminResource> {
  const res = await adminApi.patch<AdminResource>(`/admin/resources/${id}`, payload);
  return res.data;
}

export async function deleteResource(id: string): Promise<void> {
  await adminApi.delete(`/admin/resources/${id}`);
}
