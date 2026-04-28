import sanitizeHtmlLib, { type IOptions } from 'sanitize-html';

/**
 * Blog post içerikleri TipTap editöründen (ADIM 19) HTML olarak geliyor.
 * Admin panelinin içinden gelse bile stored-XSS riski var — editor HTML'i
 * saldırgan bir rol üyesi tarafından manipüle edilebilir. RSC içinde
 * `dangerouslySetInnerHTML` kullanmadan önce her içeriği burada sanitize
 * ediyoruz.
 *
 * Whitelist stratejisi: TipTap'ın default extension'ları + tablolar.
 * `<iframe>` için sadece YouTube/Vimeo embed domain'leri; diğer iframe'ler
 * silinir.
 */

const allowedTags = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'span',
  'div',
  'iframe',
];

const options: IOptions = {
  allowedTags,
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: [
      'src',
      'width',
      'height',
      'title',
      'frameborder',
      'allow',
      'allowfullscreen',
    ],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    }),
  },
};

export function sanitizeContent(raw: string): string {
  return sanitizeHtmlLib(raw, options);
}

/**
 * İçerik `<h2>` başlıklarını taradık ve her birine `id` atadık
 * → in-page anchor'lar için. Basit slugify; harfsiz karakterleri `-`a
 * çevirir, ardışık `-`leri tekilleştirir.
 */
export function extractHeadings(html: string): Array<{ id: string; text: string; level: 2 | 3 }> {
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  const headings: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = (match[2] ?? '').replace(/<[^>]+>/g, '').trim();
    if (!text) continue;
    let id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!id) continue;
    let candidate = id;
    let i = 2;
    while (seen.has(candidate)) {
      candidate = `${id}-${i++}`;
    }
    id = candidate;
    seen.add(id);
    headings.push({ id, text, level });
  }
  return headings;
}
