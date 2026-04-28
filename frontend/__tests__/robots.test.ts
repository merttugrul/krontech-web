import robots from '@/app/robots';

const ORIGINAL_ENV = process.env;

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('robots()', () => {
  it('default konfigde allow + /api & /admin disallow döner', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kron.example';
    delete process.env.NEXT_PUBLIC_ROBOTS_DISALLOW_ALL;

    const result = robots();

    expect(result.sitemap).toBe('https://kron.example/sitemap.xml');
    expect(result.host).toBe('https://kron.example');
    expect(Array.isArray(result.rules)).toBe(true);
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule).toBeDefined();
    expect(rule!.userAgent).toBe('*');
    expect(rule!.allow).toBe('/');
    expect(rule!.disallow).toEqual(
      expect.arrayContaining(['/api/', '/admin', '/admin/', '/_next/', '/static/']),
    );
  });

  it('NEXT_PUBLIC_ROBOTS_DISALLOW_ALL=true ile tüm crawl kapatılır', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.kron.example';
    process.env.NEXT_PUBLIC_ROBOTS_DISALLOW_ALL = 'true';

    const result = robots();

    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule!.userAgent).toBe('*');
    expect(rule!.disallow).toBe('/');
    expect(rule!.allow).toBeUndefined();
    expect(result.sitemap).toBe('https://staging.kron.example/sitemap.xml');
  });

  it('NEXT_PUBLIC_SITE_URL yoksa localhost:3000 fallback kullanır', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_ROBOTS_DISALLOW_ALL;

    const result = robots();
    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(result.host).toBe('http://localhost:3000');
  });

  it('SITE_URL sonundaki `/` strip edilir', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kron.example/';

    const result = robots();
    expect(result.sitemap).toBe('https://kron.example/sitemap.xml');
    expect(result.host).toBe('https://kron.example');
  });
});
