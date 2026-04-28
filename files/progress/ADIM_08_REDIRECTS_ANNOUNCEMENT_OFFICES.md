# ADIM 8 — Redirects, AnnouncementBar, Offices Modülleri

> **Durum:** ✅ Tamamlandı · **Test:** 28 unit + 38 e2e = **66 yeni test** (tümü green).

## Amaç

SEO ve içerik yönetimi için üç kritik “yardımcı” modül:

1. **Redirects** — Eski URL’lerden yenilerine yönlendirme (Next.js middleware bunu her request’te sorgular).
2. **AnnouncementBar** — Site başındaki duyuru bandı (tarih aralıklı yayın, locale’e göre).
3. **Offices** — Lokasyon listesi (footer + contact sayfası).

Üçü de kısa fakat kendi iş kurallarına sahip; tek başına ayrı adım olsalar plan şişerdi → birlikte ilerlendi.

## Oluşturulan dosyalar

```
backend/src/modules/
  redirects/
    dto/create-redirect.dto.ts
    dto/update-redirect.dto.ts
    dto/query-redirect.dto.ts
    redirects.service.ts
    redirects.service.spec.ts
    redirects.public.controller.ts
    redirects.admin.controller.ts
    redirects.module.ts
  announcement-bar/
    dto/create-announcement-bar.dto.ts
    dto/update-announcement-bar.dto.ts
    announcement-bar.service.ts
    announcement-bar.service.spec.ts
    announcement-bar.public.controller.ts
    announcement-bar.admin.controller.ts
    announcement-bar.module.ts
  offices/
    dto/create-office.dto.ts
    dto/update-office.dto.ts
    offices.service.ts
    offices.service.spec.ts
    offices.public.controller.ts
    offices.admin.controller.ts
    offices.module.ts

backend/test/
  redirects.e2e-spec.ts
  announcement-bar.e2e-spec.ts
  offices.e2e-spec.ts

backend/test/helpers/db.helper.ts   (resetCache + resetAll eklendi)
backend/src/app.module.ts           (3 yeni modül register edildi)
```

## Public API

| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/redirects/lookup?from=/old` | Aktif redirect varsa `{toPath, statusCode}`, yoksa `null`. **Agresif cache** (pozitif+negatif 5dk). |
| GET | `/api/announcement-bar?locale=en` | O an aktif duyuru bandı (tarih aralığında + `isActive=true`). |
| GET | `/api/offices?locale=en` | Locale’e göre ofis listesi (order asc, cache 10dk). |

## Admin API

| Method | Path | Roller |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/admin/redirects` | admin, editor (DELETE sadece admin) |
| GET/POST/PATCH/DELETE | `/api/admin/announcement-bar` | admin, editor (DELETE sadece admin) |
| GET/POST/PATCH/DELETE | `/api/admin/offices` | admin, editor (DELETE sadece admin) |

## Mimari kararlar

### 1. Redirect lookup — “hot path” optimizasyonu
Next.js middleware’i **her** HTTP request’te `/api/redirects/lookup` çağırabilir. Bunu iki katmanla güvenceye aldık:

- **Positive cache** (5 dk): aktif redirect bulunursa sonuç Redis’te saklanır.
- **Negative cache** (5 dk): “kayıt yok” durumu da `"NONE"` sentinel değeriyle cache’lenir — 404’lerde her seferinde DB’ye gitmiyoruz.

Sebebi basit: redirect tablosu siteye göre onlarca–yüzlerce kayıt içerebilir, ama trafik milyonlarca istek. Read-heavy + az değişen veri = cache şart.

### 2. Path normalize + self-loop koruması
`fromPath` trailing slash’tan bağımsız eşleşsin diye normalize ediliyor (`/old/` → `/old`). `toPath` ise external URL’leri (`https://`) bozmadan koruyor. `fromPath === toPath` → `BadRequestException` (sonsuz döngü).

### 3. AnnouncementBar — tarih aralığı + locale
Prisma `where`’de `(startDate IS NULL OR startDate <= now) AND (endDate IS NULL OR endDate >= now)` bileşik mantığı kuruluyor. Birden fazla aktif olursa `updatedAt desc` ile en son güncelleneni dönüyoruz. 1 dk cache — tarih sınırındaki gecikme kabul edilebilir.

### 4. Offices — basit ama cache’li
Pagination yok (footer/contact sayfasında full liste). Order asc + city asc. 10 dk cache (nadiren değişir).

### 5. Test isolation: `resetCache` + `resetAll`
Bu adımda yakalanan **ilk ciddi test-izolasyon bug’ı**: E2E test’ler millisaniye farkla koşuyor, `resetDatabase` DB’yi temizliyor ama **Redis cache** hâlâ önceki test’in sonucunu servis ediyor. Özellikle announcement-bar’da test #3 kaydı oluştur → cache ısınır → test #4 DB’yi truncate eder ama `getOrSet` cache’den eski veriyi döner → phantom record.

**Çözüm:** `db.helper.ts`’ye iki yeni fonksiyon:

- `resetCache(app)` → `RedisService.getClient().flushdb()` (test DB’si index=1, dev index=0’ı etkilemez).
- `resetAll(prisma, app)` → `Promise.all([resetDatabase, resetCache])`.

Yeni e2e spec’lerin `beforeEach`’inde `resetAll(prisma, app)` tek satır çağrılıyor. Önceki modüllerin test’leri etkilenmedi çünkü onlar cache’li public endpoint’leri aynı suite içinde çağırmıyordu.

## Test özeti

### Unit (28 yeni case)
- `redirects.service.spec.ts` (13): cache hit/miss, negative cache, conflict, self-loop, path normalize, update duplicate kontrol.
- `announcement-bar.service.spec.ts` (7): locale+isActive+tarih filter, cache skip, startDate>=endDate, audit, update NotFound.
- `offices.service.spec.ts` (8): listPublic filter, default values, findById NotFound, audit+cache invalidate.

### E2E (38 yeni case)
- `redirects.e2e-spec.ts` (14): public lookup (aktif/null/inactive/trailing-slash), admin CRUD, 401/403 RBAC, conflict, self-loop, external URL, search filter, cache invalidation (inactive → public null).
- `announcement-bar.e2e-spec.ts` (12): public active/null/inactive/expired/future/locale, admin CRUD, startDate validation, cache invalidate via update.
- `offices.e2e-spec.ts` (12): public locale+order, admin CRUD, 401/403, email/enum validation, audit, cache invalidate via update.

### Toplam durum (ADIM 8 sonrası)
```
Unit:   135 / 135  ✅   (önceki 107 + 28 yeni)
E2E:    126 / 126  ✅   (önceki 88  + 38 yeni)
Toplam: 261 / 261  ✅
```

## Karşılaşılan sorun ve çözüm

- **Redis cache leak in e2e** — Yukarıda detaylandırıldı. `resetAll` helper eklendi. Bu iyileştirme gelecekte tüm e2e suite’lerinde public endpoint test’leri için standart hâline gelecek.

## Sonraki adım

**ADIM 9 — Sitemap + Revalidation + Cron (scheduled publish).** Bu üç parça beraber:
- `/sitemap.xml` endpoint’i (tüm `published` içerikleri listeler).
- Frontend revalidation webhook (admin bir içerik yayınlayınca Next.js ISR’yi tetikler).
- `@nestjs/schedule` cron job (her dakika `scheduled` içerikleri `published`’a çevirir).
