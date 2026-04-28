# ADIM 3 — Prisma Schema + Seed

**Durum:** Tamamlandı (gerçek migration ve seed dahil)
**Süre:** ~50 dk (port çakışması debug süresi dahil)
**Test edildi:**
- `npx prisma format` — OK
- `npx prisma validate` — schema geçerli
- `npx prisma generate` — Prisma Client v5.22.0
- `npx tsc --noEmit` — seed.ts dahil **0 hata**
- `npx prisma migrate dev --name init` — **migration başarılı, 14 entity tablosu oluştu**
- `npm run prisma:seed` — **tüm seed verileri eklendi**
- Seed 2. kez çalıştırıldı, idempotent davrandı (duplicate yok)
- SQL doğrulama: admin var, kron-pam EN+TR var, FAQ items GEO için dolu

---

## Amaç
Tüm içerik modelini (14 tablo) PostgreSQL'e yansıtmak ve admin paneli açıldığında çalışan örnek verilerle dolu bir DB'ye sahip olmak.

## Oluşturulan / Değiştirilen Dosyalar

| Dosya | İşlem | Açıklama |
|---|---|---|
| `backend/prisma/schema.prisma` | Değiştirildi | Placeholder kaldırıldı, 14 entity'lik tam schema yazıldı |
| `backend/prisma/seed.ts` | Yeni | Idempotent seed: admin + kategoriler + ürün + blog + ofis + announcement |
| `backend/.env` | Yeni | `../.env`'den kopyalandı (Prisma CLI lokal için lazım) |

## Schema'da Yer Alan Modeller (14)

### Auth
- `User` (admin/editor, bcrypt hash)

### Ürün
- `ProductCategory` + `ProductCategoryTranslation`
- `Product` + `ProductTranslation`
- `Testimonial`

### İçerik
- `BlogPost` + `BlogPostTranslation` (faqItems JSON için kritik — GEO için)
- `Resource` (datasheet | casestudy | whitepaper)

### Layout / İletişim
- `Office`
- `AnnouncementBar`

### Form
- `FormSubmission` (contact | demo)

### Medya / SEO
- `Media`
- `Redirect` (301/302)

### Operasyon
- `AuditLog` (kim, ne, ne zaman değiştirdi)
- `ContentVersion` (publish snapshot'ları)

## Plan'a Eklenen İyileştirmeler

| # | Madde | Sebep |
|---|---|---|
| 1 | **`scheduledAt` field'ı** Product ve BlogPost'a eklendi | Plan'da `status: scheduled` var ama "ne zaman publish edilecek" bilgisi nereye yazılacak belirsizdi. ADIM 9'daki cron için gerekli. |
| 2 | **`@@index` eklendi** kritik query path'lerine | `[status, publishedAt]`, `[type, isHighlight]`, `[locale, isActive]`, `[entityType, entityId]` — performans için. |
| 3 | **`@@unique([entityType, entityId, version])`** ContentVersion'da | Aynı içeriğin aynı versiyonu iki kez yazılamaz. Veri bütünlüğü. |
| 4 | **`updatedAt` Office ve AnnouncementBar'a eklendi** | Plan'da yoktu; admin panelden son değişikliği göstermek için faydalı. |
| 5 | **`width`, `height` Media modeline eklendi** | Next.js Image component'i için kritik (`<Image width={x} height={y}>` gerekli). |
| 6 | **`source`, `locale` FormSubmission'a eklendi** | "Hangi sayfadan geldi?" + "Hangi dilden gönderildi?" — admin panelde değerli. |
| 7 | **`order` ProductCategory'ye eklendi** | Mega menüdeki sıralamayı DB'den kontrol etmek için. |
| 8 | **`binaryTargets`** generator'a eklendi | Docker (alpine linux-musl-openssl-3.0.x) ve macOS native ikisi birden destekleniyor. |

## Seed Verileri

| Veri Tipi | Sayı | Detay |
|---|---|---|
| Admin user | 1 | `.env`'deki `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| ProductCategory | 3 | IAM, Data Security, Telco — EN/TR çevirileriyle |
| Product | 1 | `kron-pam` (EN/TR translation, full content) |
| Testimonial | 2 | Türk Telekom, Garanti BBVA (kron-pam için) |
| Resource | 2 | 1 datasheet + 1 case study |
| BlogPost | 3 | "What is PAM?" (highlight), "2026 Trends" (highlight), "Session Recording" |
| Office | 6 | İstanbul HQ, USA, Ankara, Izmir (EN) + İstanbul, Ankara (TR) |
| AnnouncementBar | 2 | EN ve TR aktif bar |

### Seed Dosyasının Önemli Özellikleri

1. **Idempotent** — `upsert` kullanır, tekrar çalıştırınca duplicate yaratmaz.
2. **Composite unique key handling** — `productId_locale` gibi Prisma composite unique'ler doğru kullanıldı.
3. **Findable + updatable** — composite unique olmayanlar için (testimonial, resource, office, announcement) `findFirst` + `update`/`create` pattern'i.
4. **Type-safe** — `Role`, `ContentStatus`, `PostType`, `ResourceType` enum'ları Prisma'dan import edilip kullanıldı; `any` yok.
5. **Locale çiftli** — Her içeriğin EN ve TR versiyonu var; tek dilli demo değil.
6. **GEO-ready** — `faqItems` JSON alanı blog'larda dolduruldu, FAQPage schema.org için hazır.

## Karşılaşılan Sorunlar

### 1. `prisma validate` env okumadı
**Belirti:** İlk denemede `Environment variable not found: DATABASE_URL` hatası.
**Sebep:** Prisma CLI sadece `backend/.env`'i otomatik yüklüyor, root'taki `.env`'i değil.
**Çözüm:** `backend/.env` oluşturuldu (`.env.example`'dan kopya). Prisma CLI artık bunu otomatik okuyor.

### 2. Docker daemon başlangıçta kapalıydı
**Belirti:** `docker compose up -d postgres` → "Cannot connect to the Docker daemon"
**Çözüm:** Kullanıcı Docker Desktop'u başlattı.

### 3. Port çakışması — Native Postgres ve Redis
**Belirti:** `prisma migrate dev` → `P1010: User krontech was denied access on the database krontech.public`. Çok kafa karıştırıcı çünkü psql ile aynı user superuser yetkili çalışıyordu.
**Sebep tespit yöntemi:** `lsof -i :5432` ile baktım — sistemde başka bir Postgres servisi (Homebrew olabilir, PID 2036) zaten 5432 portunda çalışıyordu. `localhost:5432` Prisma tarafından bu native Postgres'e gidiyor ve oraya bizim user yok ("role does not exist" alttaki real hata; Prisma yanıltıcı şekilde "denied access" diyor).
**Çözüm:** Docker host port mapping'lerini değiştirdik:
- postgres: `5432:5432` → `5433:5432`
- redis: `6379:6379` → `6380:6379`
- Container içi network port'ları aynı kalır (5432, 6379) — backend container'dan erişim etkilenmez.
- `backend/.env` ve `.env.example` localhost portlarını yeni değerlere güncellendi.
- README'de port tablosu güncellendi.

**Ders:** Mac'te yerel servislerin standart port'ları sıkça çakışır. Docker port'larını her zaman 5433/6380 gibi alternatiflere alın, kullanıcının diğer projelerini bozmayın.

## Test Sonuçları (Gerçekleşti)

```
✓ docker compose up -d postgres redis minio   → 3/3 (healthy)
✓ docker compose run --rm minio-init           → krontech-media bucket oluştu
✓ npx prisma migrate dev --name init           → 14 tablo + Prisma Client v5.22.0
✓ npm run prisma:seed                          → tüm veriler eklendi
✓ npm run prisma:seed (2. kez)                 → idempotent, hiçbir duplicate yok
```

### SQL Doğrulama Çıktıları

| Sorgu | Beklenen | Gerçekleşen |
|---|---|---|
| `SELECT COUNT(*) FROM users WHERE role='admin'` | 1 | 1 |
| `SELECT COUNT(*) FROM products WHERE status='published'` | 1 | 1 |
| `SELECT COUNT(*) FROM product_translations WHERE locale IN ('en','tr')` | 2 | 2 |
| `SELECT COUNT(*) FROM blog_posts WHERE "isHighlight"=true` | 2 | 2 |
| `SELECT jsonb_array_length("faqItems") FROM blog_post_translations WHERE "faqItems" IS NOT NULL` | 2 (PAM blog) | 2 |
| Tablo sayısı | 14 + `_prisma_migrations` | 15 ✓ |

## Test Beklentileri

Migration ve seed sonrası beklenen DB durumu:

| Tablo | Kayıt Sayısı |
|---|---|
| `users` | 1 (admin) |
| `product_categories` | 3 |
| `product_category_translations` | 6 (3 × 2 dil) |
| `products` | 1 |
| `product_translations` | 2 |
| `testimonials` | 2 |
| `resources` | 2 |
| `blog_posts` | 3 |
| `blog_post_translations` | 6 (3 × 2 dil) |
| `offices` | 6 |
| `announcement_bars` | 2 |
| `media`, `form_submissions`, `redirects`, `audit_logs`, `content_versions` | 0 (boş, runtime'da dolacak) |

## Sonraki Adıma Bağlantı
- ADIM 4: Auth modülü, seed'deki admin user ile login akışı kuracak.
- `passport-jwt`, `JwtStrategy`, `RolesGuard`, `@Roles()` decorator'ı yazılacak.
- Test endpoint'i: `POST /api/auth/login` → admin token döner.
