function isValidSchemaObject(value: unknown): value is Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false;
  const ctx = (value as Record<string, unknown>)['@context'];
  return typeof ctx === 'string' && ctx.length > 0;
}

function normalizeForJsonLd(
  data: Record<string, unknown> | Array<Record<string, unknown>> | null | undefined,
): Record<string, unknown> | Array<Record<string, unknown>> | null {
  if (data == null) return null;
  if (Array.isArray(data)) {
    const list = data.filter(isValidSchemaObject);
    if (list.length === 0) return null;
    return list.length === 1 ? list[0]! : list;
  }
  return isValidSchemaObject(data) ? data : null;
}

interface JsonLdProps {
  /** Schema.org JSON-LD object. Dizi de olabilir (çoklu schema tek script'te). */
  data: Record<string, unknown> | Array<Record<string, unknown>> | null | undefined;
}

/**
 * Sayfa içine `<script type="application/ld+json">` injekte eder.
 * Next.js `<Script>` kullanmıyoruz çünkü structured data inline olmalı
 * (crawler'lar ekstra request beklemez).
 *
 * Güvenlik: `dangerouslySetInnerHTML` kullanırken JSON.stringify çıktısını
 * temizliyoruz (`</` → `<\/`) — XSS için en olası kaçış yolu.
 *
 * `data` null/undefined veya geçersizse (ör. `@context` yok) script basılmaz;
 * dizi içindeki null/hedges filtrelenir.
 */
export function JsonLd({ data }: JsonLdProps) {
  const normalized = normalizeForJsonLd(data);
  if (normalized == null) return null;

  const json = JSON.stringify(normalized).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
