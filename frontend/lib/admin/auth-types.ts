export type AdminRole = 'admin' | 'editor';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: AdminUser;
}

/**
 * Cookie isimleri — middleware ve client tarafı aynı isimleri kullanmalı.
 * Production'da httpOnly cookie'ye geçmek için backend'in `Set-Cookie`
 * header'ı ile token dönmesi gerekir; şimdilik frontend cookie'yi kendimiz
 * yazıyoruz (JS erişimi gereksin — `withCredentials` yerine Bearer header).
 */
export const TOKEN_COOKIE = 'kron_admin_token';
export const REFRESH_COOKIE = 'kron_admin_refresh';
export const USER_COOKIE = 'kron_admin_user';

/** 15 dakika — backend AuthService ile birebir eşleşir. */
export const TOKEN_LIFETIME_SECONDS = 15 * 60;
/** 7 gün — backend refresh token TTL'i. */
export const REFRESH_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
