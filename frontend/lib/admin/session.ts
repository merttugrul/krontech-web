'use client';

import Cookies from 'js-cookie';
import {
  REFRESH_COOKIE,
  REFRESH_LIFETIME_SECONDS,
  TOKEN_COOKIE,
  TOKEN_LIFETIME_SECONDS,
  USER_COOKIE,
  type AdminUser,
  type AuthTokens,
} from './auth-types';

/**
 * Session yönetimi — sadece client tarafında. SSR'de cookie okumak için
 * `next/headers`'ın `cookies()` API'si ayrıca kullanılıyor (middleware).
 *
 * Cookie'ler:
 *  - `kron_admin_token`  — access token (15dk, axios interceptor tarafından
 *    Authorization header'ına eklenir)
 *  - `kron_admin_refresh` — refresh token (7gün)
 *  - `kron_admin_user`    — kullanıcı payload'ı JSON (sidebar header için —
 *    trust tier düşük, backend her zaman /auth/me ile doğrulama yapar)
 *
 * `secure: true` sadece HTTPS'de set edilir; `sameSite: 'lax'` — CSRF için
 * yeterli (admin action'lar zaten Bearer + Role guard ile korunuyor).
 */
export function saveSession(tokens: AuthTokens, user: AdminUser): void {
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const common = {
    sameSite: 'lax' as const,
    secure: isSecure,
    path: '/',
  };

  Cookies.set(TOKEN_COOKIE, tokens.accessToken, {
    ...common,
    expires: new Date(Date.now() + TOKEN_LIFETIME_SECONDS * 1000),
  });
  Cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    expires: new Date(Date.now() + REFRESH_LIFETIME_SECONDS * 1000),
  });
  Cookies.set(USER_COOKIE, JSON.stringify(user), {
    ...common,
    expires: new Date(Date.now() + REFRESH_LIFETIME_SECONDS * 1000),
  });
}

export function clearSession(): void {
  Cookies.remove(TOKEN_COOKIE, { path: '/' });
  Cookies.remove(REFRESH_COOKIE, { path: '/' });
  Cookies.remove(USER_COOKIE, { path: '/' });
}

export function getAccessToken(): string | null {
  return Cookies.get(TOKEN_COOKIE) ?? null;
}

export function getRefreshToken(): string | null {
  return Cookies.get(REFRESH_COOKIE) ?? null;
}

export function getCachedUser(): AdminUser | null {
  const raw = Cookies.get(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}
