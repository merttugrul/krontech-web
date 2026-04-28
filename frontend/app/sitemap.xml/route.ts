import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * `/sitemap.xml` proxy. Backend `/sitemap.xml` (ADIM 9) XML'i üretir — biz
 * sadece frontend domain'i altından servis ediyoruz.
 *
 * Neden Next.js'te bir kez daha üretmiyoruz?
 *  - Backend zaten tüm içeriği (product/blog/resource) Prisma'dan çekip
 *    Redis'te 1 saat cache'liyor.
 *  - İki katmanlı mantık drift riski getirirdi.
 *
 * Cache: 1 saat (`revalidate = 3600`). ISR ile Google bir saatte bir yeni
 * içeriği görür. İleride `revalidateTag('sitemap')` ile on-demand refresh
 * yapılabilir (revalidate API zaten hazır — ADIM 9).
 */
export async function GET(): Promise<Response> {
  const backend = API_BASE_URL.replace(/\/$/, '');
  const url = `${backend}/sitemap.xml`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ['sitemap'] },
      headers: { Accept: 'application/xml' },
    });

    if (!res.ok) {
      // Backend sitemap down → en azından minimal bir XML döndür ki crawler
      // 500 görüp tüm siteyi deindex etmesin.
      return minimalSitemap();
    }

    const xml = await res.text();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // CDN 1 saat, browser 0 — content-as-code için güvenli.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return minimalSitemap();
  }
}

function minimalSitemap(): Response {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${siteUrl}/tr</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`;
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
