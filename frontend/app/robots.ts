import type { MetadataRoute } from 'next';

/**
 * `/robots.txt` builder. Next.js App Router metadata API.
 *
 * Stratejimiz:
 *  - Tüm public sayfalar crawl edilebilir.
 *  - `/api/*`, `/admin`, preview path'leri tamamen engellenir.
 *  - `_next`, `static` gibi Next.js internal'ları bot'lar zaten ignore eder
 *    ama disallow olarak da listelemek zarar vermez.
 *  - Sitemap referansı mutlak URL ile verilir (Google requirement).
 *
 * Production env'inde `NEXT_PUBLIC_SITE_URL` set edilmeli; dev'de
 * `http://localhost:3000` fallback'i kullanılır.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  // Preview / staging ortamlarında tüm crawl'ı kapat — content arama motorunda
  // duplicate index'lenmesin. `NEXT_PUBLIC_ROBOTS_DISALLOW_ALL=true` ile
  // tetiklenir.
  if (process.env.NEXT_PUBLIC_ROBOTS_DISALLOW_ALL === 'true') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/admin/', '/_next/', '/static/'],
      },
      // AI scraper'ları eğer belirli davranış istiyorsak buradan özelleştirilebilir
      // (ör. `GPTBot` için disallow). Şimdilik marketing site'ın tamamı açık.
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
