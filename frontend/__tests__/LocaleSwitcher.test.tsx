import { computeHrefs } from '@/components/ui/LocaleSwitcher';

describe('computeHrefs (LocaleSwitcher path rewriting)', () => {
  it('root EN → /tr', () => {
    const result = computeHrefs('/');
    expect(result).toEqual({ currentLocale: 'en', enHref: '/', trHref: '/tr' });
  });

  it('root TR → /', () => {
    const result = computeHrefs('/tr');
    expect(result).toEqual({ currentLocale: 'tr', enHref: '/', trHref: '/tr' });
  });

  it('EN nested path → TR eşdeğeri', () => {
    const result = computeHrefs('/products/telemetry-pipeline');
    expect(result).toEqual({
      currentLocale: 'en',
      enHref: '/products/telemetry-pipeline',
      trHref: '/tr/products/telemetry-pipeline',
    });
  });

  it('TR nested path → EN eşdeğeri (prefix soyulur)', () => {
    const result = computeHrefs('/tr/blog/my-slug');
    expect(result).toEqual({
      currentLocale: 'tr',
      enHref: '/blog/my-slug',
      trHref: '/tr/blog/my-slug',
    });
  });

  it('trailing slash normalize edilir', () => {
    const result = computeHrefs('/products/');
    expect(result).toEqual({
      currentLocale: 'en',
      enHref: '/products',
      trHref: '/tr/products',
    });
  });

  it('/tra (yanıltıcı prefix) TR olarak algılanmaz', () => {
    // `/tra` → `/tr/` ile başlamıyor, `/tr`'e eşit değil → EN kabul.
    const result = computeHrefs('/trademark');
    expect(result.currentLocale).toBe('en');
  });

  it('TR trailing slash (/tr/) → root TR eşdeğeri', () => {
    const result = computeHrefs('/tr/');
    expect(result).toEqual({ currentLocale: 'tr', enHref: '/', trHref: '/tr' });
  });
});
