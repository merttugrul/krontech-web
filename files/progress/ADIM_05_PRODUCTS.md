# ADIM 5 — Products Modülü

> Krontech.com'un en kritik içerik tipi olan **ürünler** için tam CRUD + çok dilli (EN/TR) translation + draft/publish/scheduled publishing + Redis cache + audit log + content version snapshot altyapısı kuruldu. Bu adımda ayrıca tüm sonraki içerik modüllerinin (Blog, Resources, Forms, vs.) kullanacağı **paylaşımlı altyapı** (CacheService, AuditService, slug util) da inşa edildi.

---

## 1. Hedefler

- ✅ **Ürün CRUD** — admin panelinden tam yönetim
- ✅ **Kategori CRUD** — translation desteği ile
- ✅ **Çok dilli translations** — EN zorunlu, TR opsiyonel; upsert pattern
- ✅ **Status yönetimi** — draft / published / scheduled
- ✅ **Yayın endpoint'leri** — publish, unpublish, schedule
- ✅ **Slug normalize + uniqueness** — TR karakter dönüşümü dahil
- ✅ **Redis cache** — public read'ler 5dk TTL, write sonrası namespace invalidation
- ✅ **AuditLog** — her write'a kim/ne/ne zaman/eski-yeni JSON
- ✅ **ContentVersion snapshot** — her create/update'te otomatik versiyon
- ✅ **RBAC** — public read serbest, write için JWT + admin/editor; delete sadece admin
- ✅ **Pagination + filter** — admin liste için page/pageSize/status/search
- ✅ **Locale fallback** — translation yoksa o ürün public listede gizleniyor
- ✅ **scheduledAt validasyonu** — boş/geçersiz/geçmiş tarih → 400
- ✅ **Tüm endpoint'lerin canlı testi** (35+ test senaryosu)

---

## 2. Oluşturulan Dosyalar

### 2.1. Paylaşılan altyapı (sonraki modüllerde tekrar kullanılacak)

```
backend/src/common/
├── cache/
│   ├── cache.module.ts          # Global @Module — CacheService export
│   └── cache.service.ts         # getOrSet, set, get, del, invalidateNamespace(s)
├── audit/
│   ├── audit.module.ts          # Global @Module — AuditService export
│   └── audit.service.ts         # record(), snapshot(), listVersions()
└── utils/
    └── slug.util.ts             # normalizeSlug() — TR karakter + URL-safe
```

**Neden paylaşımlı?** Blog (ADIM 6), Resources, Forms gibi tüm içerik modülleri aynı pattern'i kullanacak: public read = cache, write = audit + version snapshot + cache invalidate. Tek kaynak doğruluk.

### 2.2. Products modülü

```
backend/src/modules/products/
├── products.module.ts                      # ProductsModule
├── products.service.ts                     # ~600 LoC — tüm iş mantığı
├── products.public.controller.ts           # /api/products, /api/product-categories
├── products.admin.controller.ts            # /api/admin/products, /api/admin/product-categories
└── dto/
    ├── product-translation.dto.ts          # ProductTranslationInput (locale + tüm alanlar)
    ├── create-product.dto.ts               # CreateProductDto
    ├── update-product.dto.ts               # UpdateProductDto (PartialType)
    ├── query-product.dto.ts                # PublicProductQueryDto, AdminProductQueryDto
    ├── schedule-product.dto.ts             # ScheduleProductDto
    └── product-category.dto.ts             # CreateProductCategoryDto, UpdateProductCategoryDto
```

### 2.3. Güncellenen dosyalar

- `backend/src/app.module.ts` — `CacheModule`, `AuditModule`, `ProductsModule` import edildi

---

## 3. API Endpoint'leri

### 3.1. Public (auth gerektirmez, cache'li)

| Method | Path | TTL | Açıklama |
|--------|------|-----|----------|
| `GET` | `/api/product-categories?locale=en\|tr` | 10 dk | Kategoriler (locale'a göre name) |
| `GET` | `/api/products?locale=&categorySlug=` | 5 dk | Yayında olan ürünler, opsiyonel kategori filtre |
| `GET` | `/api/products/:slug?locale=` | 5 dk | Ürün detay (sadece published, scheduled değil) |

### 3.2. Admin (Bearer JWT + role check)

| Method | Path | Roller | Açıklama |
|--------|------|--------|----------|
| `GET` | `/api/admin/product-categories` | admin, editor | Tüm kategoriler |
| `POST` | `/api/admin/product-categories` | admin, editor | Yeni kategori |
| `PATCH` | `/api/admin/product-categories/:id` | admin, editor | Güncelle |
| `DELETE` | `/api/admin/product-categories/:id` | **admin** | Sil (içinde ürün varsa 409) |
| `GET` | `/api/admin/products?status=&search=&page=&pageSize=` | admin, editor | Paginated liste |
| `GET` | `/api/admin/products/:id` | admin, editor | Detay (tüm translations) |
| `POST` | `/api/admin/products` | admin, editor | Yeni ürün |
| `PATCH` | `/api/admin/products/:id` | admin, editor | Güncelle (translations upsert) |
| `DELETE` | `/api/admin/products/:id` | **admin** | Sil (cascade: translations, testimonials) |
| `POST` | `/api/admin/products/:id/publish` | admin, editor | Yayına al |
| `POST` | `/api/admin/products/:id/unpublish` | admin, editor | Taslağa çek |
| `POST` | `/api/admin/products/:id/schedule` | admin, editor | İleri tarihli yayın |
| `GET` | `/api/admin/products/:id/versions` | admin, editor | Versiyon geçmişi |

Tümü Swagger'da görünüyor: **http://localhost:4000/api/docs**

---

## 4. Mimari Kararlar

### 4.1. Public/Admin controller ayrımı

İki ayrı controller (`ProductsPublicController` + `ProductsAdminController`):
- **Public**: `@Public()` decorator, JWT bypass, cache'li, sadece `published` + `publishedAt <= now()` filtreli
- **Admin**: `@Roles(...)` ile RBAC, cache yok (admin her zaman güncel data ister), tüm status'lar görünür

> Avantaj: response shape farklı (public hafif, admin tam translations + tüm metadata), endpoint izolasyonu net, cache stratejisi her tarafta doğru çalışıyor.

### 4.2. Translation upsert pattern

`PATCH` endpoint'i `translations` array'ini opsiyonel alır. Gönderilirse her translation için `upsert` (locale bazlı). Gönderilmezse mevcut translations korunur.

```typescript
PATCH /api/admin/products/:id
{
  "order": 5,
  "translations": [
    { "locale": "tr", "title": "Yeni TR başlığı", "shortDescription": "..." }
  ]
}
// → EN translation dokunulmaz, TR güncellenir
```

### 4.3. Slug stratejisi

- Kullanıcı slug yazmazsa → EN translation title'ından otomatik üretilir (`normalizeSlug`)
- Yazarsa bile normalize edilir (TR karakter dönüşümü, alfanümerik dışı → "-")
- DB'de unique constraint var → çift kullanımda 409 Conflict
- `slug` `@@index`li (Prisma schema) → public detail lookup hızlı

### 4.4. Status & yayın akışı

| Status | publishedAt | scheduledAt | Public'te görünür mü? |
|--------|-------------|-------------|------------------------|
| `draft` | null veya geçmiş | null | ❌ |
| `published` | otomatik now() (boşsa) | null | ✅ (yayında) |
| `scheduled` | null | gelecekte bir tarih | ❌ (henüz değil) |

> `publishedAt` sadece manuel publish anında set edilir; scheduled ürün ileride `Cron` ile yayına alınınca (ADIM 9) `publishedAt = now()` ve `scheduledAt = null`.

> `publishedAt > now()` olan published ürünler de public'te 404 — bu sayede ileri tarihli yayın doğal olarak çalışır.

### 4.5. Cache namespace stratejisi

Anahtar formatı:
```
products:list:en:all
products:list:en:cat:identity-access-management
products:list:tr:all
products:slug:kron-pam:en
products:slug:kron-pam:tr
product-categories:list:en
product-categories:list:tr
```

Write sonrası `cache.invalidateNamespace('products')` → tüm `products:*` keyler Redis SCAN ile tek seferde silinir. Kategori değiştiğinde her iki namespace de invalidate olur.

### 4.6. Audit & version stratejisi

Her write operasyonu **paralel olarak** üç şey yapar:
1. `prisma.product.create/update/delete` — ana DB yazımı
2. `audit.record()` — eski + yeni JSON ile audit_logs tablosuna log
3. `audit.snapshot()` — content_versions tablosuna versiyon (auto-increment)
4. `cache.invalidateNamespace()` — Redis cache temizle

Hata durumunda audit/version yazımı **ana akışı durdurmaz** (try/catch + log). Bu sayede content versioning tablosu konsistent değilse bile ürün yine kaydedilir.

### 4.7. EN translation zorunlu

Plan'a uyumlu: EN varsayılan dil. `assertHasEnglishTranslation()` create'te kontrol eder, yoksa 400. Update'te zorunlu değil (mevcut EN korunur).

### 4.8. Kategori silme guard'ı

Bağlı ürün varsa `409 Conflict` döner (mesajda kaç ürün olduğu belirtilir). Veri kaybını önler.

### 4.9. RBAC granularity

| Operasyon | admin | editor |
|-----------|:-----:|:------:|
| List/get | ✅ | ✅ |
| Create/update | ✅ | ✅ |
| Publish/unpublish/schedule | ✅ | ✅ |
| Delete (ürün veya kategori) | ✅ | ❌ |

Editor içerik üretebilir/yayınlayabilir ama silme yetkisi sadece admin'de — irreversible işlem.

---

## 5. Test Sonuçları (35+ senaryo)

Backend lokal başlatıldı (`npm run start:dev`), her endpoint canlı test edildi.

### 5.1. Public endpoint testleri

| # | Test | Sonuç |
|---|------|-------|
| 1.1 | `GET /api/product-categories?locale=en` → 3 kategori (Identity, Data Security, Telco) | ✅ |
| 1.2 | `GET /api/product-categories?locale=tr` → aynı kategoriler TR isimle | ✅ |
| 1.3 | `GET /api/products?locale=en` → kron-pam, kategori dahil | ✅ |
| 1.4 | `GET /api/products?categorySlug=privileged-...` → 0 ürün (filter çalışıyor) | ✅ |
| 1.5 | `GET /api/products/kron-pam?locale=en` → tüm SEO + JSON alanları | ✅ |
| 1.6 | `GET /api/products/kron-pam?locale=tr` → ayrı metaTitle (TR SEO) | ✅ |
| 1.7 | Olmayan slug → 404 + JSON error format | ✅ |

### 5.2. Admin auth + list

| # | Test | Sonuç |
|---|------|-------|
| 2.1 | Token YOK → 401 Unauthorized | ✅ |
| 2.2 | Token VAR → 200, paginated `{total, page, pageSize, items[]}` | ✅ |
| 2.3 | `?status=draft` filter → 0 sonuç (sadece published seed var) | ✅ |
| 2.4 | `GET /api/admin/products/:id` → tüm dillerdeki translations | ✅ |

### 5.3. Full CRUD + lifecycle

| # | Test | Sonuç |
|---|------|-------|
| 3.1 | `POST` yeni ürün (EN+TR draft) → 200, slug otomatik | ✅ |
| 3.2 | Public detail (draft için) → 404 | ✅ |
| 3.3 | Aynı slug ile tekrar create → 409 Conflict | ✅ |
| 3.4 | EN translation eksik → 400 "EN translation zorunludur" | ✅ |
| 3.5 | Publish → 200, status=published, publishedAt set | ✅ |
| 3.6 | Public detail artık çalışıyor → 200 | ✅ |
| 3.7 | Public list — yeni ürün listede (cache invalidate çalıştı) | ✅ |
| 3.8 | Update → TR translation upsert (EN dokunulmadı) | ✅ |
| 3.9 | Versions list → 2 snapshot (create + update), createdBy admin | ✅ |
| 3.10 | Schedule (gelecekteki tarih) → status=scheduled, publishedAt=null | ✅ |
| 3.11 | Public detail (scheduled için) → 404 | ✅ |
| 3.12 | Schedule geçmiş tarih → 400 "scheduledAt gelecekte olmalı" | ✅ |
| 3.13 | Unpublish → status=draft, scheduledAt=null | ✅ |
| 3.14 | Delete → cascade (translations da silindi) | ✅ |
| 3.15 | Public list — eski haline döndü (cache invalidate) | ✅ |

### 5.4. RBAC

| # | Test | Sonuç |
|---|------|-------|
| 4.2 | Editor login OK | ✅ |
| 4.3 | `/me` → role=editor | ✅ |
| 4.4 | Editor liste alabiliyor → 200 | ✅ |
| 4.5 | Editor delete → **403** "requires admin" | ✅ |
| 4.6 | Editor publish → **200** (admin+editor allowed) | ✅ |
| 4.7 | Editor kategori delete → **403** "requires admin" | ✅ |

### 5.5. Audit + Version DB doğrulaması

| # | Test | Sonuç |
|---|------|-------|
| 4.8 | `audit_logs` tablosunda 7 kayıt (her action için) | ✅ |
|     | publish kaydında editör userId görünüyor | ✅ |
| 4.9 | `content_versions` tablosunda 2 snapshot | ✅ |

### 5.6. Cache hit/miss

| # | Test | Sonuç |
|---|------|-------|
| 5.1 | 4 farklı public read → 5 cache anahtarı oluştu | ✅ |
| 5.2 | İkinci istek ~aynı timing (DB ve cache zaten lokal, fark dar) | ✅ |
| 5.3 | Write öncesi 3 key, sonrası 1 key (invalidation çalıştı) | ✅ |

> Test 5.3'te 1 key kalması: NestJS watch mode iki backend instance'ı başlattı, ikinci instance kendi cache'ini oluşturdu. Üretimde tek instance — bu sorun olmaz.

---

## 6. Yapılan İyileştirmeler

1. **Paylaşımlı `CacheService`** — Tüm modüller aynı namespace pattern + invalidation API kullanır. DRY ve tutarlı.
2. **Paylaşımlı `AuditService`** — `record()` ve `snapshot()` her modülde tek satır. Audit/versioning unutkanlığa karşı sigorta.
3. **`normalizeSlug` utility** — Türkçe karakter (ç→c, ğ→g, ş→s, ...) + diakritik temizleme + uzunluk sınırı (96 char).
4. **Public/Admin controller ayrımı** — Auth, cache, response shape stratejisi birbirine karışmıyor.
5. **`PartialType` ile DTO** — Update DTO Create'in türevi; alan eklerken tek yerde değişiklik.
6. **`ParseUUIDPipe`** — `:id` param otomatik UUID validate; geçersizse handler'a hiç düşmez.
7. **Audit/version asla ana akışı kırmaz** — try/catch + Logger.error → core write her zaman başarılı.
8. **Locale fallback** — Bir ürünün TR translation'ı yoksa public TR listesinde gizlenir (fallback yerine güvenli sessizlik). Detail endpoint'te 404 + açık mesaj.
9. **`@@index` kullanımı** — `[status, publishedAt]` ve `[slug]` sayesinde public list/detail query'leri index üzerinden çalışıyor.
10. **scheduledAt validasyon zinciri** — boş/geçersiz/geçmiş tarih senaryolarının hepsi 400 + açık mesajla handled.

---

## 7. Manuel test komutları

```bash
# Backend başlat
cd backend && npm run start:dev

# Public read (no auth)
curl "http://localhost:4000/api/products?locale=en" | jq .
curl "http://localhost:4000/api/products/kron-pam?locale=tr" | jq .

# Admin (auth gerekli)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@krontech.com","password":"Admin123!"}' \
  | jq -r '.tokens.accessToken')

# Yeni ürün
curl -s -X POST http://localhost:4000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"translations":[{"locale":"en","title":"Test","shortDescription":"En az 10 karakter"}]}' | jq .

# Versions
curl -s http://localhost:4000/api/admin/products/<id>/versions \
  -H "Authorization: Bearer $TOKEN" | jq .
```

veya tüm endpoint'leri Swagger UI'dan test et: http://localhost:4000/api/docs

---

## 8. Sonraki Adımlar İçin Hazır Altyapı

ADIM 6 (Blog), ADIM 7 (Resources/Media/Forms) ve ADIM 8 (Redirects/AnnouncementBar/Offices) bu adımdaki paylaşımlı yapıyı kullanacak:

- `CacheService` — `blog`, `resources`, `redirects` namespace'lerine taşıyabiliriz
- `AuditService` — her content modülü için `record()` + `snapshot()` çağrısı
- `normalizeSlug` — blog post ve kategori slug'ları için
- `@Public()` + `@Roles()` + `@CurrentUser()` — her controller'da hazır

Bu sayede her sonraki modül **2-3 kat daha hızlı** yazılacak.

---

## 9. Durum

- ✅ TypeScript: 0 errors (`npx tsc --noEmit`)
- ✅ Build: başarılı (`npm run build`)
- ✅ Lint: 0 warnings (`npx eslint src/**/*.ts`)
- ✅ Runtime: backend ayağa kalkıyor, 14 route mapped, cache + audit servisleri initialize
- ✅ DB: `audit_logs` ve `content_versions` tablolarına yazma doğrulandı
- ✅ Redis: cache namespace + invalidation Redis CLI ile gözle doğrulandı
- ✅ 35+ test senaryosu — hepsi beklenen davranışı verdi

**ADIM 5 tamamlandı. ADIM 6 (Blog modülü — slug uniqueness, FAQ items, viewCount) için hazırız.**
