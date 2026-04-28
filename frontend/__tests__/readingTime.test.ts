import { readingTimeMinutes } from '@/lib/utils';

describe('readingTimeMinutes', () => {
  it('boş string için minimum 1 döner', () => {
    expect(readingTimeMinutes('')).toBe(1);
    expect(readingTimeMinutes('   ')).toBe(1);
  });

  it('kısa içerik için 1 döner', () => {
    expect(readingTimeMinutes('<p>Hello world</p>')).toBe(1);
  });

  it('HTML tag\'ları metinden soyulur', () => {
    const html = `<p>${'word '.repeat(225).trim()}</p>`;
    expect(readingTimeMinutes(html)).toBe(1);
  });

  it('~450 kelime ≈ 2 dakika', () => {
    const html = `<p>${'word '.repeat(450).trim()}</p>`;
    expect(readingTimeMinutes(html)).toBe(2);
  });

  it('~900 kelime ≈ 4 dakika', () => {
    const html = `<p>${'word '.repeat(900).trim()}</p>`;
    expect(readingTimeMinutes(html)).toBe(4);
  });
});
