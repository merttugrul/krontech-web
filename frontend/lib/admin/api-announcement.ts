'use client';

import { adminApi } from './client';
import type { AdminAnnouncementBar } from './types';

export interface CreateAnnouncementPayload {
  locale?: 'en' | 'tr';
  text: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload>;

export async function listAnnouncements(): Promise<AdminAnnouncementBar[]> {
  const res = await adminApi.get<AdminAnnouncementBar[]>('/admin/announcement-bar');
  return res.data;
}

export async function getAnnouncement(id: string): Promise<AdminAnnouncementBar> {
  const res = await adminApi.get<AdminAnnouncementBar>(`/admin/announcement-bar/${id}`);
  return res.data;
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<AdminAnnouncementBar> {
  const res = await adminApi.post<AdminAnnouncementBar>('/admin/announcement-bar', payload);
  return res.data;
}

export async function updateAnnouncement(
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<AdminAnnouncementBar> {
  const res = await adminApi.patch<AdminAnnouncementBar>(
    `/admin/announcement-bar/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await adminApi.delete(`/admin/announcement-bar/${id}`);
}
