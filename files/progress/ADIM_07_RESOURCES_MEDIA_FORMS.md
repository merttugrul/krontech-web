# ADIM 7 — Resources, Media, Forms modülleri

## Hedef

Kurumsal sitenin üç temel modülünü tek adımda teslim etmek:

1. **Media** — admin panelin görsel/dosya deposu (S3 / MinIO üzerinde).
2. **Resources** — datasheet, case study ve whitepaper yayınları (public download).
3. **Forms** — contact & demo request form submission'ları (spam koruması dahil).

Ortak dış servisler:

- `S3Service` (common/s3): presigned upload, object silme.
- `RecaptchaService` (common/recaptcha): Google reCAPTCHA v2/v3 doğrulama.

## Oluşturulan dosyalar

### Ortak altyapı

| Dosya | Amaç |
| --- | --- |
| `src/common/s3/s3.module.ts` | Global S3 modülü |
| `src/common/s3/s3.service.ts` | `presignPut`, `presignGet`, `putObject`, `deleteObject`, `getPublicUrl` |
| `src/common/recaptcha/recaptcha.module.ts` | Global reCAPTCHA modülü |
| `src/common/recaptcha/recaptcha.service.ts` | Google `siteverify` integration; test ortamında skip |

### Media modülü

| Dosya | Amaç |
| --- | --- |
| `modules/media/dto/presign-media.dto.ts` | MIME whitelist, 50MB üst sınır |
| `modules/media/dto/commit-media.dto.ts` | Upload sonrası metadata DTO'su |
| `modules/media/dto/query-media.dto.ts` | List filter (mimeType prefix, search) |
| `modules/media/media.service.ts` | Presign, commit, list, findById, updateAltText, delete |
| `modules/media/media.controller.ts` | Admin-only endpoint'ler |
| `modules/media/media.module.ts` | NestJS modül tanımı |

### Resources modülü

| Dosya | Amaç |
| --- | --- |
| `modules/resources/dto/create-resource.dto.ts` | type/productId/fileUrl/locale/title zorunlu |
| `modules/resources/dto/update-resource.dto.ts` | PartialType |
| `modules/resources/dto/query-resource.dto.ts` | Public + admin query DTO'ları |
| `modules/resources/resources.service.ts` | CRUD + cache + audit |
| `modules/resources/resources.public.controller.ts` | `GET /api/resources`, `GET /api/resources/:id` |
| `modules/resources/resources.admin.controller.ts` | Full CRUD (admin+editor) |
| `modules/resources/resources.module.ts` | NestJS modül tanımı |

### Forms modülü

| Dosya | Amaç |
| --- | --- |
| `modules/forms/dto/contact-form.dto.ts` | Contact payload + honeypot + recaptchaToken |
| `modules/forms/dto/demo-form.dto.ts` | Demo payload (company zorunlu) |
| `modules/forms/dto/query-form.dto.ts` | Admin filter (formType, tarih, search) |
| `modules/forms/forms.service.ts` | submitContact, submitDemo, list, delete |
| `modules/forms/forms.public.controller.ts` | `POST /api/forms/contact`, `POST /api/forms/demo` (rate-limited) |
| `modules/forms/forms.admin.controller.ts` | `GET /api/admin/forms`, `DELETE /api/admin/forms/:id` |
| `modules/forms/forms.module.ts` | NestJS modül tanımı |

### Test altyapısı değişiklikleri

| Dosya | Değişiklik |
| --- | --- |
| `test/helpers/app.helper.ts` | `createTestApp({ overrides })` — DI provider mock desteği |
| `test/media.e2e-spec.ts` | 11 e2e case (S3Service mock'lu) |
| `test/resources.e2e-spec.ts` | 13 e2e case |
| `test/forms.e2e-spec.ts` | 14 e2e case |
| `src/modules/media/media.service.spec.ts` | 6 unit test |
| `src/modules/resources/resources.service.spec.ts` | 11 unit test |
| `src/common/recaptcha/recaptcha.service.spec.ts` | 8 unit test |
| `src/modules/forms/forms.service.spec.ts` | 8 unit test |

## Public API

| Method | Path | Özet |
| --- | --- | --- |
| GET | `/api/resources` | Published kaynakları locale+type+productId filter ile listele (cache 5dk) |
| GET | `/api/resources/:id` | Resource detay (locale match zorunlu) |
| POST | `/api/forms/contact` | Contact form gönder (rate-limited 5/dk/IP) |
| POST | `/api/forms/demo` | Demo request gönder (rate-limited 5/dk/IP) |

## Admin API

| Method | Path | Roller | Özet |
| --- | --- | --- | --- |
| POST | `/api/admin/media/presign` | admin, editor | S3 presigned PUT URL |
| POST | `/api/admin/media/commit` | admin, editor | Upload tamamlandıktan sonra DB record |
| GET | `/api/admin/media` | admin, editor | Media library (paginated, search, mimeType) |
| GET | `/api/admin/media/:id` | admin, editor | Detay |
| PATCH | `/api/admin/media/:id/alt-text` | admin, editor | Alt text güncelle |
| DELETE | `/api/admin/media/:id` | admin | DB + S3 object sil |
| GET | `/api/admin/resources` | admin, editor | Full list (draft dahil) |
| GET | `/api/admin/resources/:id` | admin, editor | Detay |
| POST | `/api/admin/resources` | admin, editor | Yeni resource |
| PATCH | `/api/admin/resources/:id` | admin, editor | Güncelle |
| DELETE | `/api/admin/resources/:id` | admin | Sil |
| GET | `/api/admin/forms` | admin, editor | Submission listesi |
| GET | `/api/admin/forms/:id` | admin, editor | Detay |
| DELETE | `/api/admin/forms/:id` | admin | Sil (GDPR) |

## Mimari kararlar

### 1. Media: Presigned PUT + Commit pattern

Client → `/api/admin/media/presign` → `uploadUrl, key` alır → doğrudan S3'e PUT → `/api/admin/media/commit` ile metadata kaydeder. Sebepler:

- **Büyük dosyalar backend RAM'ini yemez.** Multer stream alternatifi `node`'un event-loop'unu tıkayabiliyor.
- Backend sadece imza üretir, asıl transfer bulut↔client arası.
- Test kolaylığı: `S3Service` override'la mock'lanır, gerçek MinIO bağlantısı gerekmez.

`presign` endpoint'inde **MIME whitelist** var — `text/html`, `.exe` vb. reddedilir (XSS / malware mitigation).

### 2. Resources: Basit lifecycle (no scheduled)

Resource modelinde `publishedAt` / `scheduledAt` kolonları yok. Bu yüzden:

- Yalnız `draft` ve `published` status desteklenir.
- `scheduled` gönderilirse `400 Bad Request`.
- ADIM 9'da schedule ihtiyacı netleşirse şema migration ile eklenir.

Multi-language yaklaşımı **kolon-bazlı**: aynı resource EN ve TR için iki ayrı kayıt olarak tutulur (blog/product'taki translation tablosundan farklı). Kullanım basit, ama translation mismatch hataları frontend'de manuel yönetilmeli.

### 3. Forms: Üçlü spam koruması

1. **Honeypot (`website` alanı)** — gerçek kullanıcı boş bırakır, bot doldurur → sessizce 400.
2. **Google reCAPTCHA** — prod'da zorunlu; test ortamında skip (`NODE_ENV=test`).
3. **Rate limit** — `@Throttle({ default: { limit: 5, ttl: 60_000 } })` IP başına 5 dk/dakika.

**reCAPTCHA secret yoksa** (dev'de yaygın) servis `warn` loglar ve geçer — local geliştirmede form test edilebilsin diye.

**IP ve User-Agent** submission'a kaydedilir; X-Forwarded-For header'ı öncelikli (nginx/ingress arkasında düzgün çalışması için).

**`recaptchaToken` ve `website` alanları DB'ye yazılmaz** — GDPR/minimization + `data` JSON'ında gereksiz payload birikmemesi için.

### 4. RecaptchaService: Defansif tasarım

- `NODE_ENV=test` → hiçbir şey yapmaz (e2e hızı + dış servis bağımlılığı yok).
- Secret boş veya placeholder (`your_recaptcha_secret_here`) → warn + pass.
- Google `success=false` → `UnauthorizedException`.
- v3 skor `minScore=0.5` altında → `UnauthorizedException`.
- Axios timeout → `UnauthorizedException('reCAPTCHA servisi yanıt vermedi')`.

### 5. createTestApp override desteği

`test/helpers/app.helper.ts` artık `overrides` parametresi alır:

```ts
await createTestApp({
  overrides: [{ provider: S3Service, useValue: s3Mock }],
});
```

DI container seviyesinde provider swap yapar. Media e2e testinde S3Service'i full mock'ladık; testler 100ms altı çalışıyor, MinIO'ya dokunulmuyor.

## Test sonuçları

```
Unit:  Test Suites: 10 passed, 10 total
       Tests:       107 passed, 107 total (ADIM 6: 74 → +33 bu adım)

E2E:   Test Suites: 6 passed, 6 total
       Tests:       88 passed, 88 total (ADIM 6: 50 → +38 bu adım)

TypeScript: npx tsc --noEmit → temiz
ESLint:     npm run lint → temiz
```

### Bu adımda eklenen case'ler (özet)

- **MediaService unit (6):** presign forwarding, commit + audit, list filter/pagination, findById 404, updateAltText, delete (DB+S3+audit).
- **ResourcesService unit (11):** create success/bad productId/scheduled reddi, update 404/audit, public findById (draft/locale mismatch/success), listPublic filter+pagination, delete.
- **RecaptchaService unit (8):** test env skip, no-token, empty secret fallback, placeholder secret, success, failure, low score, axios timeout.
- **FormsService unit (8):** honeypot rejection, recaptcha propagate, contact success, token/honeypot filtrelenmesi, demo formType, list filter, findById/delete 404, delete success.
- **Media e2e (11):** auth/role matrix, MIME whitelist, boyut limiti, commit + DB + audit, list pagination, mimeType filter, admin-only delete (DB+S3), alt-text patch.
- **Resources e2e (13):** public listing (status/locale/type filter), detail 404 scenarios, admin CRUD, productId validation, scheduled reddi, admin list status filter.
- **Forms e2e (14):** contact submit + persist, email/message validation, honeypot block, filtered fields, demo formType + company zorunlu, admin list RBAC + filters, admin-only delete.

## Karşılaşılan sorunlar ve çözümler

### 1. Kullanılmayan `Logger` import → TS6133

`MediaService` ve `ResourcesService` içinde `Logger` import edilmiş ama kullanılmamış. Çözüm: `Logger` import'u çıkarıldı, logger alanları silindi.

### 2. Prisma JSON filter OR tipi

`FormsService.list` search için `OR: [{ data: { path: ['email'], string_contains: ... } }]` kullanıldı. TypeScript önce cast hatası verdi; `where` içindeki `createdAt` için ayrı `Prisma.DateTimeFilter` objesi tanımlanarak düzeltildi.

### 3. Docker izinleri (sandbox)

İlk e2e çalıştırmasında `permission denied while trying to connect to the docker API at unix:///...docker.sock` hatası alındı (sandbox restriction). `required_permissions: ["all"]` ile sandbox dışında çalıştırılarak çözüldü. Bu hata geliştirici makinesinde görülmez.

### 4. createTestApp override API

Mevcut helper sadece `AppModule`'u derliyordu. S3Service'i mock'lamak için `TestingModuleBuilder`'a `overrideProvider(...).useValue(...)` çağrısı eklendi; fonksiyon imzası `CreateTestAppOptions` ile genişletildi. Backward-compatible kaldı (`createTestApp()` hâlâ çalışıyor).

## Swagger notu

`/api/docs` üzerinden yeni endpoint'ler görülebilir:

- `admin-media`, `admin-resources`, `admin-forms` (admin, JWT)
- `resources`, `forms` (public)

Her endpoint'in DTO'su, `@ApiProperty` + `@ApiOperation` ile decorated; örnek payload'lar Swagger UI'dan doğrudan Try Out yapılabilir.

## Sonraki adım

**ADIM 8 — Redirects, Announcement, Offices modülleri:**

- `Redirect` CRUD + middleware-driven 301/302 (redirects Redis'e cache'lenir, middleware her request'te query atmaz).
- `AnnouncementBar` (tekil aktif kayıt pattern'i — sadece bir tanesi "aktif" olabilir).
- `Office` modeli + public list (footer için şehir/adres listesi).
