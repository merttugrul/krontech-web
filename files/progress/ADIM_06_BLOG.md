# ADIM 6 — Blog Modülü (Blog + News + FAQ + viewCount)

**Durum:** ✅ Tamamlandı
**Kapsam:** BlogPost + BlogPostTranslation CRUD, content lifecycle (draft/published/scheduled), EN zorunlu + TR opsiyonel, FAQ items (FAQPage structured data için), view counter, cache + audit + versioning
**Toplam test:** 23 unit + 20 e2e = **43 test ✓**

---

## 1. Amaç

Krontech sitesinin **Blog** ve **News** içeriklerini yönetecek bir REST API modülü. Tek bir tablo (`blog_posts`) iki içerik türünü (`PostType.blog`, `PostType.news`) `type` sütunu ile ayırır; frontend `/blog` ve `/news` URL'lerini filter query ile besler. Her post'un birden fazla dilde (EN zorunlu, TR opsiyonel) çevirisi, SEO alanları ve **FAQ items** (GEO optimizasyonu için FAQPage JSON-LD'ye dönüştürülecek) vardır.

### Öne çıkan özellikler

| Özellik | Detay |
| --- | --- |
| **Dual-type** | Aynı tablo `blog` + `news` type'larını ayırır; API tek set endpoint sunar |
| **isHighlight** | Sidebar "öne çıkan" listesi için bayrak — public list default sıralama `isHighlight DESC, publishedAt DESC` |
| **viewCount** | Her public detail GET'te fire-and-forget `INCREMENT`; cache'ten bağımsız (gerçek trafik sayılır) |
| **FAQ items** | Translation başına `[{question, answer}]` JSON — frontend'de FAQPage schema'ya serialize edilecek (ADIM 18) |
| **Author** | Blog yazısını yazan User; create'te `authorId` verilmezse request sahibi set edilir |
| **Lifecycle** | `draft → published → (unpublish→draft)` + `scheduled` — publish zamanı `publishedAt`; geleceğe plan `scheduledAt` |

---

## 2. Yaratılan/Değiştirilen dosyalar

```
backend/src/modules/blog/
├── blog.module.ts
├── blog.service.ts                 ← 530 satır, ana iş mantığı
├── blog.service.spec.ts            ← 23 unit test
├── blog.public.controller.ts       ← GET /api/blog, GET /api/blog/:slug
├── blog.admin.controller.ts        ← admin CRUD + lifecycle + versions
└── dto/
    ├── blog-translation.dto.ts     ← BlogTranslationInput + FaqItemInput
    ├── create-blog-post.dto.ts
    ├── update-blog-post.dto.ts     ← PartialType(CreateBlogPostDto)
    ├── query-blog-post.dto.ts      ← Public + Admin query DTO'ları
    └── schedule-blog-post.dto.ts

backend/test/
├── blog.e2e-spec.ts                ← 20 e2e test
└── helpers/db.helper.ts            ← +seedBlogPost fixture

backend/src/app.module.ts           ← BlogModule kaydı
files/progress/ADIM_06_BLOG.md      ← bu doküman
```

---

## 3. API Yüzeyi

### Public (Authentication yok, cache: 5 dk)

| Method | URL | Açıklama |
| --- | --- | --- |
| `GET` | `/api/blog` | Listede filtre: `locale`, `type` (blog/news), `isHighlight`, `page`, `pageSize` (default 12, max 50). Sadece `published` + `publishedAt ≤ now`. |
| `GET` | `/api/blog/:slug` | Detail + her çağrıda viewCount+1 (fire-and-forget). Locale yoksa 404. |

### Admin (`@ApiBearerAuth JWT-auth` + `@Roles`)

| Method | URL | Role | Açıklama |
| --- | --- | --- | --- |
| `GET` | `/api/admin/blog` | admin, editor | Paginated liste + filter: `status`, `type`, `search` |
| `GET` | `/api/admin/blog/:id` | admin, editor | Tüm translations dahil |
| `POST` | `/api/admin/blog` | admin, editor | Yeni post (authorId default: request user) |
| `PATCH` | `/api/admin/blog/:id` | admin, editor | Partial update + translation upsert |
| `DELETE` | `/api/admin/blog/:id` | **admin only** | Cascade: translations, versions |
| `POST` | `/api/admin/blog/:id/publish` | admin, editor | status=published |
| `POST` | `/api/admin/blog/:id/unpublish` | admin, editor | status=draft, scheduledAt=null |
| `POST` | `/api/admin/blog/:id/schedule` | admin, editor | Body: `{ scheduledAt }` — gelecekte olmalı |
| `GET` | `/api/admin/blog/:id/versions` | admin, editor | Snapshot geçmişi |

---

## 4. Mimari Kararlar

### 4.1 Products ile pattern parity
Controller ayrımı (public/admin), service yapısı, cache namespace'i (`blog`), audit + snapshot akışı, slug resolve, EN-mandatory, `parseScheduledAt` helper — tümü **ADIM 5 Products** ile birebir. Aynı disiplin; altıncı modülden sonra ortak "content module base class"ı çıkarmak düşünülebilir (ADIM 8 sonrası).

### 4.2 Tek controller, iki content type
`PostType.blog` ve `PostType.news` tek endpoint altında birleşti. Alternatif (ayrı `/api/blog` ve `/api/news` URL'leri) reddedildi çünkü:
- DB layer aynı tablo → API'nin de aynı olması doğal.
- Frontend filter (`?type=news`) tek parametreyle ilgileniyor.
- Sıralama, pagination, cache logic'i duplicate edilmiyor.

### 4.3 viewCount stratejisi
```typescript
// Detail cached (5 dk); increment her zaman çalışır.
const detail = await cache.getOrSet(...)
this.prisma.blogPost.update({
  where: { slug },
  data: { viewCount: { increment: 1 } },
}).catch(err => logger.warn(...))
return detail
```
- **Neden fire-and-forget?** Response latency'sine eklememek için. Update başarısız olsa bile kullanıcıya 500 dönmez.
- **Neden cache'ten bağımsız?** Cache'ten dönerse bile view sayılır — aksi takdirde cache TTL boyunca count artmazdı.
- **Trade-off:** Bot'lar/pre-fetcher'lar count'u şişirebilir. ADIM 18'de `User-Agent` filtresi veya Redis-based rate limit eklenebilir.
- **Çok büyük trafik senaryosu:** DB write'ları darboğaz olursa Redis counter + cron flush pattern'ine geçilir (ADIM 9+).

### 4.4 FAQ items JSON kolonu
```typescript
// DTO: validated array → Prisma: JSON column
faqItems?: FaqItemInput[]  →  BlogPostTranslation.faqItems: Json?
```
- `class-validator`'ın `@ValidateNested({ each: true }) + @Type(() => FaqItemInput)` kombinasyonu nested array'i strict doğrular.
- `ArrayMaxSize(50)` — DoS payload koruması.
- JSON kolon seçimi: FAQ yapısı blog-specific; ayrı tablo overkill. Bu alan ADIM 18'de `<script type="application/ld+json">` olarak render edilecek.

### 4.5 Author handling
- `authorId` opsiyonel → boşsa token sahibi (`CurrentUser.id`).
- Her durumda `user.findUnique` ile varlığı doğrulanır (aksi halde FK violation runtime'da patlar).
- Silinmiş kullanıcının postları: `BlogPost.authorId` FK `onDelete` default (RESTRICT) — user silinemez önce post'ları başka birine assign edilmeli. (Blog şemasında explicit action yok; Prisma default restrict.)

### 4.6 isHighlight sıralaması
Public list default order: `[{ isHighlight: 'desc' }, { publishedAt: 'desc' }]`.
- Öne çıkan postlar her zaman tepede (sidebar widget).
- Frontend ayrıca `?isHighlight=true` ile sadece featured'ları çekebilir.

---

## 5. Test Çıktısı

### Unit testler (`blog.service.spec.ts`) — 23 case

| Grup | Case |
| --- | --- |
| `create` | EN translation yoksa 400 |
| `create` | authorId boşsa request sahibi atanır |
| `create` | verilen authorId yoksa 400 |
| `create` | slug boş ise EN title'dan normalize |
| `create` | TR karakter normalize (`Öne-Çıkan-Yazı!` → `one-cikan-yazi`) |
| `create` | slug çakışınca 409 |
| `create` | scheduled + scheduledAt yoksa 400 |
| `create` | scheduledAt geçmişte ise 400 |
| `create` | status=published → publishedAt auto-set |
| `create` | type default=blog, news override edilebilir |
| `create` | audit.record + audit.snapshot + cache invalidate |
| `create` | faqItems JSON olarak saklanır |
| `findBySlugPublic` | draft → 404 |
| `findBySlugPublic` | publishedAt gelecekte → 404 |
| `findBySlugPublic` | translation yok → 404 |
| `findBySlugPublic` | başarılı detail (content, faqItems, SEO) |
| `findBySlugPublic` | viewCount increment çağrılır |
| `publish` | status + audit + cache |
| `schedule` | geçmiş tarih → 400 |
| `schedule` | gelecek tarih → scheduled + audit |
| `delete` | hard delete + audit + cache |
| `delete` | olmayan id → 404 |
| `listAdmin` | pagination + search + status + type filter |

### E2E testler (`blog.e2e-spec.ts`) — 20 case

| Grup | Case |
| --- | --- |
| Public | GET /blog list — published, paginated |
| Public | locale=tr → TR title döner |
| Public | type=news filter |
| Public | isHighlight=true filter |
| Public | GET /blog/:slug published → 200 + content |
| Public | GET /blog/:slug draft → 404 |
| Public | GET /blog/:slug scheduled → 404 |
| Public | GET /blog/:slug olmayan → 404 |
| Public | viewCount artar (2 call → DB'de ≥2) |
| Admin | token yok → 401 |
| Admin | GET /admin/blog paginated |
| Admin | editor DELETE → 403 (admin only) |
| Admin | editor publish → 200 |
| Lifecycle | draft create → public list boş |
| Lifecycle | sadece TR translation → 400 |
| Lifecycle | aynı slug ikinci create → 409 |
| Lifecycle | create → publish → public 200 → delete → 404 |
| Lifecycle | PATCH → upsert + yeni version |
| Lifecycle | FAQ items create + public detail'de döner |
| Cache | write → `blog:*` key sayısı 0'a iner |

### Toplam proje testi (Blog dahil)

```
Unit:  6 suites,  74 tests  ✓
E2E:   3 suites,  50 tests  ✓
─────────────────────────────
Total:            124 tests  ✓
```

Lint + tsc temiz.

---

## 6. Karşılaşılan Sorunlar ve Çözümleri

### Sorun 1 — `TypeError: Cannot read properties of undefined (reading 'catch')`
**Sebep:** `findBySlugPublic` içindeki fire-and-forget `prisma.blogPost.update(...).catch(...)` pattern'i, unit testte `update` mock'u default `undefined` döndürüyordu → `.catch` çağrılamıyor.
**Çözüm:** Test `beforeEach` setup'ında `update: jest.fn().mockResolvedValue({})` default tanımlandı.

### Sorun 2 — E2E'de 400 yerine 201 beklenen 2 test düştü
**Sebep:** Test payload'larında `content: '<p>x</p>'` (8 char); DTO'da `@MinLength(10)` var.
**Çözüm:** Content string'leri en az 10 karakter olacak şekilde düzeltildi (`<p>duplicate body</p>` vb.).

---

## 7. Manuel test için örnek komutlar

```bash
# Admin login (seed sonrası)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@krontech.com","password":"Admin123!"}' | jq -r .tokens.accessToken)

# Yeni blog post oluştur
curl -X POST http://localhost:4000/api/admin/blog \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "blog",
    "isHighlight": true,
    "translations": [{
      "locale": "en",
      "title": "Krontech PAM 2.0 Launch",
      "excerpt": "Next-gen privileged access management is here.",
      "content": "<p>Main HTML body...</p>",
      "faqItems": [
        {"question":"What is PAM?","answer":"Privileged Access Management."}
      ]
    }]
  }'

# Publish
curl -X POST http://localhost:4000/api/admin/blog/<id>/publish \
  -H "Authorization: Bearer $TOKEN"

# Public detail (viewCount artar)
curl http://localhost:4000/api/blog/krontech-pam-2-0-launch?locale=en
```

---

## 8. Bir sonraki adım

**ADIM 7 — Resources, Media, Forms modülleri.**

| Modül | Özet |
| --- | --- |
| Resources | Datasheet / Case Study / Whitepaper; file upload (MinIO presigned URL), gated download (form submission sonrası) |
| Media | Global asset manager; S3 upload flow, alt text, dimensions |
| Forms | Contact + demo request + resource request; reCAPTCHA doğrulama, rate limit |

Test checklist template aynı patternle devam edecek (min 12 unit + 12 e2e, lifecycle + RBAC + validation).
