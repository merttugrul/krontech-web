import { parseResourceTypeParam, resourceTypeLabel } from '@/lib/resources';
import { getDictionary } from '@/lib/i18n';

describe('parseResourceTypeParam', () => {
  it.each(['datasheet', 'casestudy', 'whitepaper'] as const)(
    'geçerli type "%s" olduğu gibi döner',
    (value) => {
      expect(parseResourceTypeParam(value)).toBe(value);
    },
  );

  it('undefined girişte null döner', () => {
    expect(parseResourceTypeParam(undefined)).toBeNull();
  });

  it('bilinmeyen değerde null döner', () => {
    expect(parseResourceTypeParam('ebook')).toBeNull();
    expect(parseResourceTypeParam('')).toBeNull();
  });
});

describe('resourceTypeLabel', () => {
  const en = getDictionary('en');
  const tr = getDictionary('tr');

  it('EN sözlüğünden doğru label döner', () => {
    expect(resourceTypeLabel('datasheet', en)).toBe(en.resources.typeDatasheet);
    expect(resourceTypeLabel('casestudy', en)).toBe(en.resources.typeCasestudy);
    expect(resourceTypeLabel('whitepaper', en)).toBe(en.resources.typeWhitepaper);
  });

  it('TR sözlüğünden doğru label döner', () => {
    expect(resourceTypeLabel('datasheet', tr)).toBe('Veri Sayfası');
    expect(resourceTypeLabel('casestudy', tr)).toBe('Vaka Analizi');
    expect(resourceTypeLabel('whitepaper', tr)).toBe('Beyaz Kitap');
  });
});
