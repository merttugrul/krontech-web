'use client';

import axios from 'axios';
import { adminApi } from './client';
import type { AdminMedia, AdminPaginated, AllowedMime, PresignResponse } from './types';

export interface ListMediaParams {
  page?: number;
  pageSize?: number;
  search?: string;
  mimeType?: string;
}

export async function listMedia(
  params: ListMediaParams = {},
): Promise<AdminPaginated<AdminMedia>> {
  const res = await adminApi.get<AdminPaginated<AdminMedia>>('/admin/media', {
    params,
  });
  return res.data;
}

export async function presignMediaUpload(input: {
  mimeType: AllowedMime;
  originalName: string;
  size: number;
  prefix?: string;
}): Promise<PresignResponse> {
  const res = await adminApi.post<PresignResponse>('/admin/media/presign', input);
  return res.data;
}

export async function commitMedia(input: {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText?: string;
}): Promise<AdminMedia> {
  const res = await adminApi.post<AdminMedia>('/admin/media/commit', input);
  return res.data;
}

export async function deleteMedia(id: string): Promise<void> {
  await adminApi.delete(`/admin/media/${id}`);
}

export async function updateMediaAltText(id: string, altText: string): Promise<AdminMedia> {
  const res = await adminApi.patch<AdminMedia>(`/admin/media/${id}/alt-text`, { altText });
  return res.data;
}

/**
 * Uçtan uca upload: presign → PUT S3/MinIO → commit.
 * Image'lar için width/height otomatik okunur (canvas ile).
 */
export async function uploadMediaFile(file: File): Promise<AdminMedia> {
  const mime = file.type as AllowedMime;

  const { uploadUrl, key } = await presignMediaUpload({
    mimeType: mime,
    originalName: file.name,
    size: file.size,
  });

  // Presigned PUT — raw axios (admin interceptor'ı bypass, Authorization
  // header yok; S3/MinIO query-signed URL).
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    timeout: 60_000,
  });

  const dims = await readImageDimensions(file).catch(() => null);

  return commitMedia({
    key,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    ...(dims ?? {}),
  });
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return null;
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
