/**
 * @jest-environment jsdom
 */
import Cookies from 'js-cookie';
import {
  TOKEN_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
} from '@/lib/admin/auth-types';
import {
  saveSession,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getCachedUser,
} from '@/lib/admin/session';

describe('admin/session', () => {
  beforeEach(() => {
    // jsdom'da document.cookie üzerinden temizle
    Cookies.remove(TOKEN_COOKIE, { path: '/' });
    Cookies.remove(REFRESH_COOKIE, { path: '/' });
    Cookies.remove(USER_COOKIE, { path: '/' });
  });

  it('saveSession → getAccessToken, getRefreshToken, getCachedUser', () => {
    saveSession(
      {
        accessToken: 'access.jwt.a',
        refreshToken: 'refresh.jwt.b',
        expiresIn: 900,
      },
      { id: 'user-1', email: 'admin@krontech.com', role: 'admin' },
    );

    expect(getAccessToken()).toBe('access.jwt.a');
    expect(getRefreshToken()).toBe('refresh.jwt.b');
    expect(getCachedUser()).toEqual({
      id: 'user-1',
      email: 'admin@krontech.com',
      role: 'admin',
    });
  });

  it('clearSession siler', () => {
    saveSession(
      { accessToken: 't', refreshToken: 'r', expiresIn: 60 },
      { id: 'u', email: 'a@b.c', role: 'editor' },
    );
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCachedUser()).toBeNull();
  });

  it('getCachedUser corrupt JSON ise null döner', () => {
    Cookies.set(USER_COOKIE, 'not-json{}[');
    expect(getCachedUser()).toBeNull();
  });

  it('getAccessToken cookie yoksa null döner', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getCachedUser()).toBeNull();
  });
});
