'use client';

import axios, { AxiosError, type AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/lib/api';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from './session';
import type { LoginResponse } from './auth-types';

/**
 * Admin-only axios instance. Her request'te Bearer token ekler; 401 alınca
 * refresh token ile tek deneme yapar, başarısız olursa session'ı temizler
 * ve `/admin/login`'e yönlendirir.
 *
 * Neden ayrı instance? Public `api` (lib/api.ts) marketing tarafında token
 * göndermemeli (CORS preflight'i büyür, gereksiz). Interceptor'ları ayırıp
 * sorumluluk temiz tutuyoruz.
 */
export const adminApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

interface RetriableConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await axios.post<LoginResponse>(
      `${API_BASE_URL.replace(/\/$/, '')}/api/auth/refresh`,
      { refreshToken: refresh },
      { timeout: 10_000 },
    );
    saveSession(res.data.tokens, res.data.user);
    return res.data.tokens.accessToken;
  } catch {
    return null;
  }
}

adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & RetriableConfig) | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // /auth/refresh endpoint'i 401 dönerse sonsuz döngü olur — guard.
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Birden fazla paralel istek 401 aldığında tek refresh çalışsın.
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
    return adminApi.request(original);
  },
);
