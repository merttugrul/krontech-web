'use client';

import { adminApi } from './client';
import type { AdminOffice } from './types';

export interface CreateOfficePayload {
  city: string;
  email: string;
  phone: string;
  fax?: string;
  address: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  order?: number;
  locale?: 'en' | 'tr';
}

export type UpdateOfficePayload = Partial<CreateOfficePayload>;

export async function listOffices(): Promise<AdminOffice[]> {
  const res = await adminApi.get<AdminOffice[]>('/admin/offices');
  return res.data;
}

export async function getOffice(id: string): Promise<AdminOffice> {
  const res = await adminApi.get<AdminOffice>(`/admin/offices/${id}`);
  return res.data;
}

export async function createOffice(payload: CreateOfficePayload): Promise<AdminOffice> {
  const res = await adminApi.post<AdminOffice>('/admin/offices', payload);
  return res.data;
}

export async function updateOffice(
  id: string,
  payload: UpdateOfficePayload,
): Promise<AdminOffice> {
  const res = await adminApi.patch<AdminOffice>(`/admin/offices/${id}`, payload);
  return res.data;
}

export async function deleteOffice(id: string): Promise<void> {
  await adminApi.delete(`/admin/offices/${id}`);
}
