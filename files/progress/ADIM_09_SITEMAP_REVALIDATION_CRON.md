# ADIM 9 — Sitemap + Revalidation + Scheduled Publish (Cron)

> Durum: ✅ **Tamamlandı** · Testler yeşil (161 unit / 141 e2e · tüm proje)

## 🎯 Hedef

Üç bağımsız ama birbirini besleyen parçayı tek adımda bitirmek:

1. **On-demand revalidation** — Backend bir içerik yayınladığında, Next.js ISR cache'ini
   tag/path bazında invalide eden HTTP çağrısı. Editör "Publish"e bastıktan 1-2
   saniye sonra kullanıcı güncel sürümü görür.
2. **Scheduled publish (cron)** — `@nestjs/schedule` ile her dakika çalışan runner;
   `status=scheduled && scheduledAt <= now` kayıtlarını `published`'a geçirir,
   publishedAt set eder, scheduledAt'ı null'lar, audit log + revalidation
   tetikler.
3. **Sitemap** — Google Search Console için `GET /sitemap.xml`. Statik sayfalar
   (× 2 locale) + published products (× 2 locale) + published blog posts (× 2
   locale) + published resources (locale kolonuna göre tek). XML escape'li,
   1 saat Redis cache'li.

Neden birlikte? Yayınlama (publish) aksiyonu üçünü de tetikler: audit log yazılır,
sitemap cache'i invalide olur, frontend revalidate edilir. Cron tetiklediğinde de
aynı dağıtım yapılır.

## 📁 Yeni/Değişen Dosyalar

### Yeni (common)
- `backend/src/common/revalidation/revalidation.service.ts` — Next.js
  `/api/revalidate` endpoint'ine POST atar. Tag ve path destekli. Fire-and-forget
  (hata tolere edilir). `NODE_ENV=test` veya `NEXT_PUBLIC_SITE_URL` yoksa no-op.
- `backend/src/common/revalidation/revalidation.module.ts` — Global modül,
  her yerden `RevalidationService` inject edilebilir.
- `backend/src/common/scheduler/scheduler.service.ts` — `@Cron(EVERY_MINUTE)`
  handler; products + blog posts için `scheduled → published` transition; audit
  + cache invalidate + revalidation.
- `backend/src/common/scheduler/scheduler.module.ts`

### Yeni (modül)
- `backend/src/modules/sitemap/sitemap.service.ts` — URL koleksiyonu + XML
  render; `getOrSet` ile 1 saat Redis cache'li.
- `backend/src/modules/sitemap/sitemap.controller.ts` — `@Public() GET /sitemap.xml`,
  `Content-Type: application/xml`, `Cache-Control: public, max-age=3600`.
- `backend/src/modules/sitemap/sitemap.module.ts`

### Değişen
- `backend/src/config/env.validation.ts` — `NEXT_PUBLIC_SITE_URL?: string` eklendi.
- `backend/src/main.ts` — `exclude: ['health', 'sitemap.xml', 'robots.txt']` (önceki
  'sitemap' yerine tam dosya adı).
- `backend/src/app.module.ts` — `RevalidationModule`, `SchedulerModule`,
  `SitemapModule` kayıtları.
- `backend/src/modules/products/products.service.ts` — `RevalidationService`
  injection + `triggerProductRevalidation(slugs)` helper. Her mutation sonrası
  (category + product CUD) tag `products` + `sitemap` ve slug-specific path'ler
  revalidate edilir.
- `backend/src/modules/blog/blog.service.ts` — aynı pattern; `invalidateCaches`
  içinde tag `blog` + `sitemap` revalidate.
- `backend/src/modules/resources/resources.service.ts` — `triggerRevalidation(id, locale)`
  helper (resources id-based URL).
- `backend/.env` + `.env.example` — `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

### Testler
- `backend/src/common/revalidation/revalidation.service.spec.ts` (9 case)
- `backend/src/common/scheduler/scheduler.service.spec.ts` (6 case)
- `backend/src/modules/sitemap/sitemap.service.spec.ts` (11 case)
- `backend/test/sitemap.e2e-spec.ts` (9 case)
- `backend/test/scheduler.e2e-spec.ts` (6 case)
- Retrofit: `products.service.spec.ts`, `blog.service.spec.ts`,
  `resources.service.spec.ts` — `RevalidationService` mock providers'a eklendi.

## 🔑 Mimari Kararlar

### RevalidationService — fire-and-forget
Neden `catch(() => {})` / `Promise.catch`? Yayınlama ana akışı (DB write) çalıştı,
ama frontend geçici olarak down → revalidation hatası ana flow'u patlatmamalı.
Eventual consistency: ISR'ın natural TTL'i (frontend tarafında) fallback olarak
çalışır.

### Next.js kontratı (frontend henüz yok)
Backend, `POST ${NEXT_PUBLIC_SITE_URL}/api/revalidate` çağırır; body:
```json
{ "secret": "REVALIDATION_SECRET", "tags": ["products","sitemap"], "paths": ["/en/products/widget-a"] }
```
Frontend route handler (ADIM 10+) bu sözleşmeyi karşılayacak. Secret header yerine
body'de yollandı — basit query-string injection hatalarını engellemek için.

### Scheduler — 1 dk granülerlik
`@Cron(CronExpression.EVERY_MINUTE)`. Editoryel içerik için "dakika içinde yayında"
SLA yeterli. Her item ayrı try/catch → bir hata diğer item'ları etkilemez,
metric: `{ productsPublished, blogPostsPublished, failed }`.

Publish anında sitemap cache'i invalide edilir ve tags `products,blog,sitemap` +
paths `/products/<slug>` & `/blog/<slug>` revalidate edilir.

`NODE_ENV=test` iken cron no-op — e2e testlerde istenmeyen tetiklemeleri önler.
`publishScheduled()` public olduğu için testler doğrudan çağırabilir.

### Sitemap cache stratejisi
- `getOrSet('sitemap:xml:v1', loader, 3600)` → 1 saatlik cache.
- İçerik mutation'larında (products/blog/resources CUD) namespace `sitemap`
  invalidate edilir → bir sonraki request regenerate.
- Versiyon suffix'i (`:v1`) → sitemap format'ı değişirse tek satırla rotate.

### Sitemap URL şeması
- Statik sayfalar: `{base}/{locale}/{path?}` (boş path → homepage).
- Product / Blog: `{base}/{locale}/products/{slug}` × 2 locale (çünkü çoklu
  çeviri tek içerik üzerinde yaşıyor).
- Resource: tek locale kolonu → `{base}/{locale}/resources/{id}` × 1.

### Global prefix exclusion
`app.setGlobalPrefix('api', { exclude: ['sitemap.xml', ...] })` ile `/sitemap.xml`
kök path'te yayınlanır (Google `/api/sitemap.xml`'i okumaz).

## 🌐 Endpoint

| Method | Path              | Auth     | Açıklama                                                             |
|--------|-------------------|----------|----------------------------------------------------------------------|
| GET    | `/sitemap.xml`    | Public   | Tüm published içerikleri listeleyen XML sitemap. 1 saat cache.        |

> Revalidation HTTP endpoint'i bilinçli olarak backend tarafında yok — çıkış
> yönü one-way (backend → frontend). Frontend `/api/revalidate` route handler'ı
> ADIM 10+ içinde gelecek.

## 🧪 Test Sonuçları

### Unit
```
Test Suites: 16 passed, 16 total
Tests:       161 passed, 161 total  (+26 bu adım)
```
Yeni suite'ler:
- `revalidation.service.spec.ts` — 9 case (test-env skip, siteUrl/secret fallback,
  tag/path POST body, trailing slash normalize, axios failure swallow).
- `scheduler.service.spec.ts` — 6 case (boş batch, multi-entity batch,
  findMany filter, partial failure, publishedAt idempotency, `NODE_ENV=test` skip).
- `sitemap.service.spec.ts` — 11 case (statik × locale, only-published product,
  blog dual-locale, resource single-locale, XML declaration, XML escape, cache
  TTL, fallback base URL, invalidate).

### E2E
```
Test Suites: 11 passed, 11 total
Tests:       141 passed, 141 total  (+15 bu adım)
```
- `sitemap.e2e-spec.ts` — 9 case: endpoint 200 + content-type, statik sayfalar,
  published product ekleme, draft product filtreleme, blog ekleme, scheduled
  blog filtreleme, resource single-locale, Cache-Control, XML escape.
- `scheduler.e2e-spec.ts` — 6 case: scheduled→published transition (product +
  blog), future scheduledAt skip, batch transition, audit kaydı, draft/published
  intact.

Manuel tetikleme örneği (gerektiğinde):
```ts
const scheduler = app.get(SchedulerService);
await scheduler.publishScheduled(new Date());
```

## ⚠️ Karşılaşılan Sorunlar

1. **Retrofit sırasında 3 mevcut spec'in test modülüne `RevalidationService` mock
   eklemek gerekti.** Yoksa `Nest can't resolve dependencies of ...Service (?, ?, ?, +)`
   hatası — products/blog/resources servislerine yeni dependency inject edildi.
2. **`seedUsers` çifte çağrısı** → sitemap e2e testinin eski sürümü `beforeEach`
   sonrası tekrar `seedUsers` çağırıyordu, unique constraint ihlali oluştu.
   Düzeltme: `prisma.user.findFirstOrThrow({ email: 'admin@test.local' })`.
3. **`app.setGlobalPrefix` exclude path'i** 'sitemap' iken controller route
   'sitemap.xml' → 404. Exclude entry `'sitemap.xml'`'e düzeltildi.

## 🎬 Manuel Deneme Checklist

```bash
# Servisi ayağa kaldır (.env'de REVALIDATION_SECRET, NEXT_PUBLIC_SITE_URL dolu)
cd backend && npm run start:dev

# Sitemap
curl -s http://localhost:4000/sitemap.xml | head -30
# → <?xml version="1.0" encoding="UTF-8"?> … <urlset …>

# Sitemap cache ısınmış mı
curl -I http://localhost:4000/sitemap.xml
# → Cache-Control: public, max-age=3600

# Bir product scheduled yap (admin token ile)
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"slug":"widget-a","status":"scheduled","scheduledAt":"2026-04-21T09:00:00Z", ...}'

# 1 dk sonra log'da:
# [SchedulerService] [scheduler] published 1 products, 0 blog posts, 0 failed
```

## 🚀 Sıradaki Adım

**ADIM 10 — Next.js frontend kurulumu.** App Router + TypeScript + Tailwind.
Bu adımda ayrıca:
- `app/api/revalidate/route.ts` (bu adımdaki sözleşmeyi karşılayacak)
- `next.config.js`'te `output: 'standalone'`, experimental.typedRoutes
- i18n routing (`/en`, `/tr`)
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATION_SECRET`
