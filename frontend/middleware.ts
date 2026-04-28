import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decideRedirect, type RedirectLookup } from '@/lib/middleware-helpers';
import { TOKEN_COOKIE } from '@/lib/admin/auth-types';

/**
 * Next.js middleware — her request'te çalışır, static asset'leri ve `/api/*`
 * route'ları matcher ile dışarıda bırakıyoruz.
 *
 * Ana iş: backend `/api/redirects/lookup?from=<path>` endpoint'ini çağırıp
 * yanıt varsa 301/302 redirect uygula. Backend bu lookup'ı Redis'te 5 dk
 * cache'ler (pozitif + negatif), dolayısıyla middleware DB'ye gitmez.
 *
 * Güvenlik önlemleri:
 *  - Döngü koruması: `from === toPath` ise redirect yapılmaz.
 *  - Yalnızca relative toPath veya whitelist edilmiş dış host'lara yönlendirme
 *    yapılır (şimdilik relative — backend DTO zaten relative zorluyor).
 *  - Lookup hatasında sessizce devam (middleware hiç error fırlatmamalı;
 *    site downtime olmaz).
 *
 * Performans: Her request için ~5-10ms network overhead. High-traffic
 * senaryolarda edge runtime + Redis doğrudan bağlantı alternatifi
 * düşünülebilir; şimdilik backend proxy yeterli.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;

  // ─── 1) Admin auth guard ────────────────────────────────────────────
  // `/admin` ile başlayan tüm rotalar login hariç cookie'de token gerektirir.
  // Redirect lookup bu path'ler için yapılmaz — admin zaten dış dünyaya açık
  // değil ve gereksiz overhead doğurur.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = req.cookies.get(TOKEN_COOKIE)?.value;
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      // Giriş yaptıktan sonra buraya geri dönmek için `next` query param ekle.
      loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ─── 2) Redirect lookup (marketing site) ────────────────────────────
  const lookup = await lookupRedirect(pathname);
  const decision = decideRedirect(pathname, lookup);
  if (decision.action === 'skip') return NextResponse.next();

  const targetUrl = req.nextUrl.clone();
  targetUrl.pathname = decision.toPath;
  targetUrl.search = search; // query string'i koru
  return NextResponse.redirect(targetUrl, decision.statusCode);
}

async function lookupRedirect(from: string): Promise<RedirectLookup | null> {
  const backend = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
    /\/$/,
    '',
  );
  const url = `${backend}/api/redirects/lookup?from=${encodeURIComponent(from)}`;

  try {
    // 2 saniye timeout — middleware hiçbir zaman hang'lememeli.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, {
      signal: controller.signal,
      // Edge runtime fetch caching — default cache davranışını bırak (5 dk TTL
      // backend tarafında Redis'te).
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = (await res.json()) as { redirect?: RedirectLookup | null };
    return data.redirect ?? null;
  } catch {
    // Network error, timeout, JSON parse — tümünü yut, devam et.
    return null;
  }
}

/**
 * Middleware matcher: static asset'leri ve Next.js internal'ları dışarıda
 * bırakır. Bunlar için redirect lookup anlamsız + her request'te overhead olur.
 *
 * Dahil OLMAYAN path'ler:
 *  - /api/*              (Next.js route handler'ları — zaten backend proxy)
 *  - /_next/*            (Next.js runtime assets)
 *  - /favicon.ico, /robots.txt, /sitemap.xml (kök-level well-known'lar)
 *  - /* dosya uzantılı   (img/css/js vb. static file'lar)
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
