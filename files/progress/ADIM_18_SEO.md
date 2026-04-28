# ADIM 18 — SEO altyapısı (sitemap, robots, structured data, redirect middleware)

**Durum:** ✅ Tamamlandı
**Tarih:** 2026-04-20
**Önceki adım:** ADIM 17 (Contact + Demo sayfaları + reCAPTCHA)
**Sonraki adım:** ADIM 19 (Admin panel — TipTap rich text editör dahil)

## Amaç

Marketing site için tam SEO altyapısını devreye almak:

- **robots.txt** — Next.js `MetadataRoute.Robots` API ile dinamik, env-aware
- **sitemap.xml** — Backend'in (ADIM 9) zaten ürettiği sitemap'i Next.js route
  handler ile proxy'leyip frontend domain'inden servis etmek
- **Structured data** — Site-level `Organization` + `WebSite` JSON-LD'lerini
  root layout'a enjekte etmek (sayfa-özel Product/Article/Breadcrumb JSON-LD'ler
  ADIM 14/15'te zaten eklenmişti)
- **Redirect middleware** — Next.js `middleware.ts` ile her request'te backend
  `/api/redirects/lookup` endpoint'ini çağırıp 301/302 yönlendirme uygulamak
- **Metadata polish** — `keywords`, `twitter` card, `icons`, `viewport`,
  `googleBot` direktifleri

## Oluşturulan dosyalar

```
frontend/
├── app/
│   ├── layout.tsx                      (zenginleştirildi — JSON-LD, keywords, twitter, icons, viewport)
│   ├── robots.ts                       (yeni — MetadataRoute.Robots)
│   └── sitemap.xml/route.ts            (yeni — backend proxy)
├── middleware.ts                       (yeni — redirect lookup)
├── lib/
│   ├── jsonld.ts                       (yeni — Organization + WebSite builder'lar)
│   └── middleware-helpers.ts           (yeni — decideRedirect, isSafeRelativePath)
└── __tests__/
    ├── robots.test.ts                  (yeni — 4 case)
    ├── jsonld.test.ts                  (yeni — 4 case)
    └── middleware-helpers.test.ts      (yeni — 12 case)
```

## 1. robots.ts

Next.js `MetadataRoute.Robots` API kullandık. Avantajı:

- `/robots.txt` otomatik olarak build edilir, static dosya yönetmek gerekmez.
- Env değişkenlerinden dinamik çalışır.
- TypeScript compile-time doğrulama.

Varsayılan kurallar:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin/
Disallow: /_next/
Disallow: /static/

Sitemap: https://kron.example/sitemap.xml
Host: https://kron.example
```

**Staging/preview flag**: `NEXT_PUBLIC_ROBOTS_DISALLOW_ALL=true` set edilirse
tüm crawl kapanır (`Disallow: /`). Vercel preview deployment'larda otomatik set
edilmesi tavsiye edilir.

## 2. sitemap.xml proxy

Backend (ADIM 9) `GET /sitemap.xml` endpoint'i zaten tüm product/blog/resource
içeriği Redis'te 1 saat cache'liyor. Frontend'de tekrar implement etmek
duplikasyon ve drift riski doğurur, bu yüzden **route handler proxy** seçtik:

`frontend/app/sitemap.xml/route.ts`:
- `fetch(backend/sitemap.xml)` + `next: { revalidate: 3600, tags: ['sitemap'] }`
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- Backend down → minimal fallback XML (sadece `/` + `/tr`) — Google SERP'ten
  site'ı deindex etmesin diye.

**On-demand refresh** için backend'in Products/Blog/Resources servisleri zaten
`revalidate({ tags: ['sitemap'] })` çağırıyor (ADIM 9 retrofit). Bu tetikleme
`app/api/revalidate/route.ts`'e geliyor, o da Next.js `revalidateTag('sitemap')`
invoke ediyor, route handler cache'i sıfırlanıyor. Zincir kurulmuş.

## 3. Redirect middleware

### Mimari

```
Browser request (e.g. /eski-sayfa)
        ↓
Next.js Edge Middleware (middleware.ts)
        ↓
fetch(backend/api/redirects/lookup?from=/eski-sayfa)   ← Redis cache (5 dk)
        ↓
{ redirect: { toPath: '/yeni-sayfa', statusCode: 301 } }
        ↓
decideRedirect(pathname, lookup) → { action: 'redirect', ... }
        ↓
NextResponse.redirect('/yeni-sayfa', 301)
```

### Güvenlik kontrolleri

`lib/middleware-helpers.ts`'te pure fonksiyonlar:

- **`isSafeRelativePath`** — `/path` kabul eder, `//evil.com`,
  `http://...`, `/\malicious` reddeder. **Open-redirect açığını** engeller.
- **`normalizePath`** — trailing slash'i normalize eder (`/x/` ↔ `/x`).
- **`decideRedirect`** — lookup sonucu ile decision üretir (`skip` veya
  `redirect` + status). Döngü koruması (self-redirect) burada.

### Performans

- Her request'te 1 backend call (5-10ms, Redis cache hit).
- 2 sn timeout + `try/catch` ile network error sessizce yutulur (site hiçbir
  zaman middleware yüzünden down olmaz).
- `cache: 'no-store'` — backend'in kendi TTL'ini (5 dk) kullanır, middleware'i
  stale yapmaz.

### Matcher

```ts
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
]
```

Static asset'leri (css/js/img), Next.js internal'ları, `/api/*` ve
well-known dosyaları matcher'ın dışında bırakır — redirect lookup yalnızca
sayfa request'lerinde çalışır.

**Build çıktısı**: `ƒ Middleware  26.8 kB` — edge bundle boyutu kabul edilebilir.

## 4. Site-wide JSON-LD

`lib/jsonld.ts` iki builder:

### `buildOrganizationJsonLd(siteUrl)`

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Krontech",
  "url": "https://kron.example",
  "logo": "https://kron.example/logo.png",
  "sameAs": ["https://linkedin.com/company/krontech", ...],
  "contactPoint": [{
    "contactType": "customer support",
    "email": "info@krontech.com",
    "availableLanguage": ["English", "Turkish"]
  }]
}
```

### `buildWebsiteJsonLd(siteUrl)`

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "inLanguage": ["en", "tr"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kron.example/search?q={search_term_string}"
  }
}
```

Root layout'ta tek `<script type="application/ld+json">` etiketinde bir array
olarak basılıyor. Sayfa-özel JSON-LD'ler (Product, Article, Breadcrumb) ek
etiket olarak child sayfalarda kalıyor. Google rich results bu çoklu-JSON-LD
yapısını destekliyor.

## 5. Metadata polish

`app/layout.tsx`'e eklendi:

- **keywords** — Krontech markası + ürün isimleri (PAM, Single Connect, Double
  Octopus, Zero Trust vb.)
- **twitter** card — `summary_large_image`, `@krontech` handle
- **icons** — favicon.ico, SVG icon, apple-touch-icon
- **manifest** — `/manifest.webmanifest` (PWA readiness)
- **robots.googleBot** — `max-image-preview: large`, `max-snippet: -1` (Google
  cümle uzunluğu limitini kaldırıyor)
- **viewport** (ayrı export — Next.js 14 convention) — `themeColor` light/dark
  + `colorScheme`
- **formatDetection** — telefon/email otomatik linkleme kapalı (iOS Safari'de
  UI karışmasın)

## Testler

### Unit tests

| Dosya | Case | Kapsam |
|---|---|---|
| `__tests__/robots.test.ts` | 4 | Default config, disallow-all flag, SITE_URL fallback, trailing slash normalize |
| `__tests__/jsonld.test.ts` | 4 | Organization şekli, contactPoint, WebSite inLanguage, SearchAction urlTemplate |
| `__tests__/middleware-helpers.test.ts` | 12 | `normalizePath` (4), `decideRedirect` (8 — null/redirect/status/open-redirect/self-loop/protokol-relative) |

### Toplam frontend test durumu

```
Test Suites: 19 passed, 19 total
Tests:       133 passed, 133 total (önceki 113 + 20 yeni)
```

### Doğrulama komutları

```bash
npm test          # 133/133 pass
npm run type-check # 0 errors
npm run lint      # 0 warnings
npm run build     # success, 0 errors
```

### Build route listesi (yeni eklenenler)

```
○ /robots.txt          0 B
ƒ /sitemap.xml         0 B    (route handler — dinamik)
ƒ Middleware         26.8 kB  (edge bundle)
```

## Kullanıcı test senaryoları

### Manuel smoke test

```bash
# 1) Local dev başlat
cd frontend && npm run dev
cd backend && npm run start:dev

# 2) Robots
curl http://localhost:3000/robots.txt
# → User-agent: *, Allow: /, Disallow: /api/, Sitemap: http://localhost:3000/sitemap.xml

# 3) Sitemap
curl http://localhost:3000/sitemap.xml
# → XML urlset (backend'den proxy'lenmiş — ürün/blog/resource URL'leri)

# 4) Redirect (önce admin API ile redirect yarat)
curl -X POST http://localhost:4000/api/admin/redirects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fromPath":"/eski","toPath":"/yeni","statusCode":301,"isActive":true}'

# 5) Browser'da /eski'yi ziyaret et → /yeni'ye 301 redirect olmalı
curl -I http://localhost:3000/eski
# → HTTP/1.1 301, Location: /yeni

# 6) Self-loop koruması
# Admin: fromPath=/x, toPath=/x yaratıp curl -I /x → 200 olmalı, redirect değil

# 7) Open-redirect koruması
# Admin: toPath=http://evil.com yaratıp (backend DTO bunu reddeder ama middleware
# de defensive koruma sağlar) → 200, redirect yok
```

### Structured data doğrulama

Chrome DevTools → Elements → `<head>` altında iki `<script type="application/ld+json">`:
1. Root layout'tan gelen (Organization + WebSite — array)
2. Sayfa özel (Product / Article / Breadcrumb — eğer varsa)

Google Rich Results Test: https://search.google.com/test/rich-results
URL: `http://localhost:3000/tr/products/<slug>` → "Eligible for rich results" beklenir.

## Karar notları

### Neden `app/sitemap.xml/route.ts` (raw XML)? `app/sitemap.ts` (MetadataRoute.Sitemap) değil?

Next.js `app/sitemap.ts` kullanıcıya `MetadataRoute.Sitemap` objesi dönmeyi
mecbur bırakır — bu da tüm URL'leri frontend'de enumerate etmek gerektirir
(tüm product/blog/resource slug'larını fetch). Backend zaten bunu yapıyor ve
Redis'te cache'liyor; iki yerde implement etmek drift yaratır. Route handler
proxy ile tek bir kaynak-of-truth koruyoruz.

### Neden middleware'de lookup için `fetch` yerine direkt Redis?

Edge runtime'da Redis client (ioredis) çalışmıyor (Node.js-specific API). HTTP
proxy en güvenli yöntem. Backend zaten 5dk cache'liyor; yüksek trafikte
istersek CDN'e (Cloudflare Workers KV vs.) taşıyabiliriz.

### Neden `NEXT_PUBLIC_ROBOTS_DISALLOW_ALL` ayrı bir flag?

Preview/staging deployment'larda duplicate index'lenmesini engellemek kritik —
`staging.kron.com` Google'da boy göstermemeli. Vercel/CI pipeline'da production
dışı environment'larda otomatik `true` set edilmesi önerilir.

### Neden self-redirect koruması?

Admin UI'da yanlış redirect girişi sonsuz loop yaratır → Next.js 301 → 301 →
... Browser bunu algılar ama yine de 10+ redirect yaşar. `decideRedirect`
pure fonksiyonunda `normalizePath` ile erken skip ediyoruz.

## Sıradaki adım

**ADIM 19 — Admin panel**: JWT login + TipTap rich text editor ile product/blog
CRUD UI'ı. Marketing site bu SEO altyapısını kullanmaya devam edecek; admin
panel `/admin/*` path'indeyken middleware zaten `/admin` altında disallow
yazmayacak ama `isAuthenticated` guard ile korunacak.
