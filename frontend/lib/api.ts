import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

/**
 * Paylaşılan axios instance. Hem Server Components (RSC fetch yerine) hem
 * Client Components kullanır. `baseURL` env'den gelir; default localhost:4000.
 *
 * Neden axios? `fetch` + JSON error handling + interceptor zinciri yazmak
 * yerine axios'un response.data.message path'inden kullanıcıya yakın hatalar
 * üretiyoruz. React Query ile birlikte retry/cache React Query tarafında.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_URL ?? API_BASE_URL;

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Server-side fetch helper. Next.js ISR için `next: { revalidate, tags }`
 * option'larını destekler. Client-side'da `api.get/post` kullanılır.
 *
 * Kullanım (RSC):
 *   const products = await sfetch<Product[]>('/products', { tags: ['products'] });
 */
export async function sfetch<T>(
  path: string,
  opts: {
    method?: 'GET' | 'POST';
    body?: unknown;
    tags?: string[];
    revalidate?: number;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const url = `${SERVER_API_BASE_URL.replace(/\/$/, '')}/api${path}`;
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    next: {
      revalidate: opts.revalidate ?? 60,
      tags: opts.tags,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(
      `API ${opts.method ?? 'GET'} ${path} → ${res.status}: ${errorText.slice(0, 200)}`,
    );
  }

  return (await res.json()) as T;
}

/**
 * Friendly error text extractor. Client Components'ta toast/hata kutusu için.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Bir hata oluştu'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export type RequestConfig = AxiosRequestConfig;
