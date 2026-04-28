import { decideRedirect, normalizePath } from '@/lib/middleware-helpers';

describe('normalizePath', () => {
  it('kök path `/` olduğu gibi döner', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('sondaki slash siler', () => {
    expect(normalizePath('/products/')).toBe('/products');
  });

  it('slash olmayan yolu değiştirmez', () => {
    expect(normalizePath('/products')).toBe('/products');
  });

  it('iç path\'lerdeki slashları değiştirmez', () => {
    expect(normalizePath('/blog/post-1/')).toBe('/blog/post-1');
  });
});

describe('decideRedirect', () => {
  it('lookup null ise skip döner', () => {
    expect(decideRedirect('/foo', null)).toEqual({ action: 'skip' });
  });

  it('relative toPath + farklı path için 301 döner', () => {
    expect(
      decideRedirect('/old-page', { toPath: '/new-page', statusCode: 301 }),
    ).toEqual({ action: 'redirect', toPath: '/new-page', statusCode: 301 });
  });

  it('statusCode 302 ise 302 döner', () => {
    expect(
      decideRedirect('/old', { toPath: '/new', statusCode: 302 }),
    ).toEqual({ action: 'redirect', toPath: '/new', statusCode: 302 });
  });

  it('tanımsız statusCode default 301\'e düşer', () => {
    const result = decideRedirect('/old', { toPath: '/new', statusCode: 418 });
    expect(result).toEqual({ action: 'redirect', toPath: '/new', statusCode: 301 });
  });

  it('absolute toPath (open-redirect) için skip döner', () => {
    expect(
      decideRedirect('/old', {
        toPath: 'https://evil.com/x',
        statusCode: 301,
      }),
    ).toEqual({ action: 'skip' });
  });

  it('toPath mevcut path ile aynıysa skip döner', () => {
    expect(
      decideRedirect('/products', { toPath: '/products', statusCode: 301 }),
    ).toEqual({ action: 'skip' });
  });

  it('trailing slash fark etmeksizin aynı path için skip döner', () => {
    expect(
      decideRedirect('/products', { toPath: '/products/', statusCode: 301 }),
    ).toEqual({ action: 'skip' });
    expect(
      decideRedirect('/products/', { toPath: '/products', statusCode: 301 }),
    ).toEqual({ action: 'skip' });
  });

  it('protokol-relative URL (//evil.com) için skip döner', () => {
    expect(
      decideRedirect('/old', {
        toPath: '//evil.com/x',
        statusCode: 301,
      }),
    ).toEqual({ action: 'skip' });
  });
});
