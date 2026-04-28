'use client';

import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';
import { adminApi } from './client';
import { clearSession, saveSession } from './session';
import type { AdminUser, LoginResponse } from './auth-types';

/**
 * Login isteği kendi başına bir axios çağrısı — admin interceptor'ı bypass
 * ediyoruz, henüz token olmadığı için.
 */
export async function login(email: string, password: string): Promise<AdminUser> {
  const res = await axios.post<LoginResponse>(
    `${API_BASE_URL.replace(/\/$/, '')}/api/auth/login`,
    { email, password },
    { timeout: 10_000 },
  );
  saveSession(res.data.tokens, res.data.user);
  return res.data.user;
}

/**
 * Session'ı temizler ve kullanıcıyı login sayfasına atar.
 *
 * Backend tarafında refresh token'ı revoke eden endpoint yok (yalnızca TTL
 * bazlı); bu kabul edilebilir çünkü cookie silinince token tekrar kullanılamaz.
 */
export function logout(): void {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
}

export async function fetchMe(): Promise<AdminUser> {
  const res = await adminApi.get<AdminUser>('/auth/me');
  return res.data;
}
