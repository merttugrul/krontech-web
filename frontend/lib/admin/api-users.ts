'use client';

import { adminApi } from './client';
import type { AdminRole } from './auth-types';
import type { AdminUserAccount } from './types';

export interface CreateUserPayload {
  email: string;
  password: string;
  role?: AdminRole;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export async function listUsers(): Promise<AdminUserAccount[]> {
  const res = await adminApi.get<AdminUserAccount[]>('/admin/users');
  return res.data;
}

export async function getUser(id: string): Promise<AdminUserAccount> {
  const res = await adminApi.get<AdminUserAccount>(`/admin/users/${id}`);
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUserAccount> {
  const res = await adminApi.post<AdminUserAccount>('/admin/users', payload);
  return res.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<AdminUserAccount> {
  const res = await adminApi.patch<AdminUserAccount>(`/admin/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await adminApi.delete(`/admin/users/${id}`);
}
