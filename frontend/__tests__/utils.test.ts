import { cn, formatDate, getLocaleFromPath, localePrefix, truncate } from '@/lib/utils';

describe('utils', () => {
  describe('getLocaleFromPath', () => {
    it('returns tr for /tr paths', () => {
      expect(getLocaleFromPath('/tr')).toBe('tr');
      expect(getLocaleFromPath('/tr/blog/foo')).toBe('tr');
    });
    it('returns en for anything else', () => {
      expect(getLocaleFromPath('/')).toBe('en');
      expect(getLocaleFromPath('/products/widget')).toBe('en');
    });
  });

  describe('localePrefix', () => {
    it('en → empty string (kök)', () => {
      expect(localePrefix('en')).toBe('');
    });
    it('tr → /tr', () => {
      expect(localePrefix('tr')).toBe('/tr');
    });
  });

  describe('cn', () => {
    it('falsy değerleri filtreler', () => {
      expect(cn('a', false, null, 'b', undefined, '')).toBe('a b');
    });
  });

  describe('truncate', () => {
    it('metin kısa → değişmez', () => {
      expect(truncate('short', 10)).toBe('short');
    });
    it('uzun metin → trim + ellipsis', () => {
      expect(truncate('abcdefghij', 5)).toBe('abcd…');
    });
  });

  describe('formatDate', () => {
    it('tr locale → Türkçe ay adı', () => {
      const result = formatDate('2026-01-15T00:00:00Z', 'tr');
      expect(result).toMatch(/Ocak|2026/);
    });
    it('en locale → English month name', () => {
      const result = formatDate('2026-01-15T00:00:00Z', 'en');
      expect(result).toMatch(/January|2026/);
    });
  });
});
