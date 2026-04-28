import {
  parseSolution,
  parseHowItWorks,
  parseKeyBenefits,
  parseProductFamily,
  parseVideos,
  youtubeEmbedUrl,
} from '@/lib/schemas/product-detail';

describe('parseSolution', () => {
  it('geçerli payload başarıyla parse edilir', () => {
    const result = parseSolution({
      heading: 'Solution',
      description: 'Kron unifies telemetry.',
      bullets: ['One', 'Two'],
    });
    expect(result).toMatchObject({
      heading: 'Solution',
      description: 'Kron unifies telemetry.',
      bullets: ['One', 'Two'],
    });
  });

  it('heading olmadan da geçerlidir (opsiyonel)', () => {
    const result = parseSolution({ description: 'ABC' });
    expect(result?.description).toBe('ABC');
    expect(result?.heading).toBeUndefined();
  });

  it('description yoksa null döner', () => {
    expect(parseSolution({ heading: 'No body' })).toBeNull();
  });

  it('string input → null (null-safe)', () => {
    expect(parseSolution('invalid')).toBeNull();
    expect(parseSolution(null)).toBeNull();
  });
});

describe('parseHowItWorks', () => {
  it('minimum 1 adım gerekli', () => {
    expect(parseHowItWorks({ steps: [] })).toBeNull();
  });

  it('her adımın title + description zorunlu', () => {
    const ok = parseHowItWorks({
      steps: [
        { title: 'A', description: 'B' },
        { title: 'C', description: 'D' },
      ],
    });
    expect(ok?.steps).toHaveLength(2);

    const bad = parseHowItWorks({ steps: [{ title: 'A' }] });
    expect(bad).toBeNull();
  });
});

describe('parseKeyBenefits', () => {
  it('bilinmeyen icon otomatik check ile değiştirilir', () => {
    const result = parseKeyBenefits({
      items: [
        { title: 'Benefit', description: 'Desc', icon: 'nonexistent' as unknown as 'shield' },
      ],
    });
    expect(result?.items[0]?.icon).toBe('check');
  });

  it('geçerli icon korunur', () => {
    const result = parseKeyBenefits({
      items: [{ title: 'T', description: 'D', icon: 'shield' }],
    });
    expect(result?.items[0]?.icon).toBe('shield');
  });
});

describe('parseProductFamily', () => {
  it('slugs boş ise null', () => {
    expect(parseProductFamily({ slugs: [] })).toBeNull();
  });

  it('geçerli slug listesi parse edilir', () => {
    const r = parseProductFamily({ heading: 'Family', slugs: ['a', 'b'] });
    expect(r?.slugs).toEqual(['a', 'b']);
  });
});

describe('parseVideos', () => {
  it('geçersiz URL reddedilir', () => {
    expect(
      parseVideos({ items: [{ title: 'X', youtubeUrl: 'https://vimeo.com/1' }] }),
    ).toBeNull();
  });

  it('youtube.com ve youtu.be kabul edilir', () => {
    const ok = parseVideos({
      items: [
        { title: 'A', youtubeUrl: 'https://www.youtube.com/watch?v=abc123' },
        { title: 'B', youtubeUrl: 'https://youtu.be/xyz789' },
      ],
    });
    expect(ok?.items).toHaveLength(2);
  });
});

describe('youtubeEmbedUrl', () => {
  it('watch?v= → embed', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('youtu.be kısa URL', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('shorts path', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('embed path zaten embed formatında', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('geçersiz URL → null', () => {
    expect(youtubeEmbedUrl('not-a-url')).toBeNull();
    expect(youtubeEmbedUrl('https://vimeo.com/123')).toBeNull();
  });
});
