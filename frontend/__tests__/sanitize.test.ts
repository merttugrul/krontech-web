import { sanitizeContent, extractHeadings } from '@/lib/sanitize';

describe('sanitizeContent', () => {
  it('<script> tag silinir', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeContent(dirty)).toBe('<p>Hello</p>');
  });

  it('inline event handler temizlenir', () => {
    const dirty = '<a href="https://x.com" onclick="alert(1)">Link</a>';
    const clean = sanitizeContent(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('href="https://x.com"');
  });

  it('external link\'lere nofollow + target=_blank eklenir', () => {
    const clean = sanitizeContent('<a href="https://example.com">ex</a>');
    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer nofollow"');
  });

  it('javascript: protocol reddedilir', () => {
    const dirty = '<a href="javascript:alert(1)">bad</a>';
    const clean = sanitizeContent(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('güvenli YouTube iframe korunur', () => {
    const dirty =
      '<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>';
    expect(sanitizeContent(dirty)).toContain('youtube.com/embed/abc');
  });

  it('tanımsız host iframe silinir', () => {
    const dirty = '<iframe src="https://evil.com/tracker"></iframe>';
    const clean = sanitizeContent(dirty);
    expect(clean).not.toContain('evil.com');
  });

  it('formatting tagları korunur', () => {
    const html = '<p><strong>bold</strong> and <em>italic</em> and <code>code</code></p>';
    expect(sanitizeContent(html)).toBe(html);
  });

  it('başlık hiyerarşisi korunur', () => {
    const html = '<h2>Section</h2><h3>Sub</h3><p>Body</p>';
    expect(sanitizeContent(html)).toBe(html);
  });

  it('tablolar korunur', () => {
    const html =
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table>';
    expect(sanitizeContent(html)).toBe(html);
  });
});

describe('extractHeadings', () => {
  it('h2 ve h3 başlıkları çıkarır, id üretir', () => {
    const html = '<h2>Getting Started</h2><h3>Install</h3>';
    const result = extractHeadings(html);
    expect(result).toEqual([
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'install', text: 'Install', level: 3 },
    ]);
  });

  it('içinde <strong> olan başlıkta tag\'ı soyar', () => {
    const html = '<h2>Hello <strong>world</strong>!</h2>';
    expect(extractHeadings(html)[0]).toEqual({
      id: 'hello-world',
      text: 'Hello world!',
      level: 2,
    });
  });

  it('duplicate başlıklar -2, -3 suffix alır', () => {
    const html = '<h2>Same</h2><h2>Same</h2><h2>Same</h2>';
    const result = extractHeadings(html);
    expect(result.map((h) => h.id)).toEqual(['same', 'same-2', 'same-3']);
  });

  it('h1, h4-h6 yok sayılır (sadece h2/h3)', () => {
    const html = '<h1>Top</h1><h4>Deep</h4><h2>Yes</h2>';
    const result = extractHeadings(html);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('yes');
  });
});
