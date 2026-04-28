/**
 * Admin route için cookie-based guard kararının saf test'i.
 * middleware.ts'deki karar mantığını küçük bir pure fonksiyon ile
 * ayna tutuyoruz — edge runtime'ı Jest'te çalıştırmak maliyetli.
 */
type GuardOutcome =
  | { type: 'pass' }
  | { type: 'redirect'; to: string };

function adminGuard(pathname: string, hasToken: boolean): GuardOutcome {
  if (pathname === '/admin/login') return { type: 'pass' };
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!hasToken) return { type: 'redirect', to: '/admin/login' };
    return { type: 'pass' };
  }
  return { type: 'pass' };
}

describe('admin guard (middleware aynasi)', () => {
  it('/admin/login → token yoksa bile geçer', () => {
    expect(adminGuard('/admin/login', false)).toEqual({ type: 'pass' });
  });

  it('/admin → token yoksa login\'e redirect', () => {
    expect(adminGuard('/admin', false)).toEqual({ type: 'redirect', to: '/admin/login' });
  });

  it('/admin/products → token yoksa login\'e redirect', () => {
    expect(adminGuard('/admin/products', false)).toEqual({
      type: 'redirect',
      to: '/admin/login',
    });
  });

  it('/admin/blog/abc → token varsa geçer', () => {
    expect(adminGuard('/admin/blog/abc', true)).toEqual({ type: 'pass' });
  });

  it('marketing path (/blog) — guard etkilemez', () => {
    expect(adminGuard('/blog', false)).toEqual({ type: 'pass' });
  });
});
