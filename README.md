# Krontech.com — Yeniden Geliştirme Projesi

Krontech kurumsal web sitesinin modern altyapı ile yeniden geliştirilmiş hâli.
Mevcut görsel tasarım korunarak; yönetilebilir içerik, çok dilli yapı, SEO/GEO uyumu, performans ve sürdürülebilir mimari hedeflenmiştir.

---

## Teknoloji Stack

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + TypeScript** | SSR/ISR, dosya bazlı routing, built-in image optimization |
| Backend | **NestJS + TypeScript** | Modüler mimari, dependency injection, geniş ekosistem |
| ORM | **Prisma** | Type-safe sorgular, otomatik migration, schema-first model |
| Veritabanı | **PostgreSQL 16** | Sağlam ACID, JSON desteği, full-text search |
| Cache | **Redis 7** | API/redirect cache, hızlı invalidation |
| Medya | **MinIO (S3-compatible)** | Local'de S3 davranışı, prod'da gerçek S3'e sıfır kod değişikliğiyle geçiş |
| Auth | **JWT (access 15dk + refresh 7gün)** | Stateless, mikroservislere uyumlu, gerekirse Redis revoke listesi eklenebilir |
| API | **REST + Swagger / OpenAPI** | Yaygın, Postman/curl uyumlu, otomatik dokümantasyon |
| Test | **Jest + Supertest** | NestJS'in default'u, hızlı, in-memory mock'a uygun |
| Container | **Docker + Docker Compose** | Tek komutla local geliştirme |

---

## Hızlı Başlangıç

### Gereksinimler
- Docker Desktop 24+ (Compose v2)
- Boş portlar: `3000`, `4000`, `5433`, `6380`, `9000`, `9001`
  > Not: PostgreSQL ve Redis için 5433/6380 kullanıyoruz çünkü çoğu Mac'te native servisler 5432/6379'u tutar. Container içinde standart 5432/6379 kullanılır.

### Kurulum
```bash
git clone <repo-url>
cd "Kron Site"
cp .env.example .env
docker compose up --build
```

İlk kurulumda imajların inmesi ve build 3-5 dakika sürebilir.

### Servis Adresleri

| Servis | URL | Erişim |
|---|---|---|
| Frontend (Next.js) | http://localhost:3000 | Public |
| Backend API | http://localhost:4000 | Public |
| Swagger Docs | http://localhost:4000/api/docs | Public |
| Admin Panel | http://localhost:3000/admin | Login gerekli |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |
| PostgreSQL | `localhost:5433` | `krontech` / `password` |
| Redis | `localhost:6380` | — |
| Health (Nest) | http://localhost:4000/health | API önizleme; prefix dışı (`/api` yok) |

### Admin Login
- E-posta: `.env` içindeki `ADMIN_EMAIL` (varsayılan: `admin@krontech.com`)
- Şifre: `.env` içindeki `ADMIN_PASSWORD` (varsayılan: `Admin123!`)

---

## Klasör Yapısı

```
Kron Site/
├── frontend/             # Next.js 14 uygulaması (App Router)
├── backend/              # NestJS API
├── files/                # plan, ilerleme özetleri (ADIM_*.md), referans
│   └── progress/         # adım adım ilerleme notları
├── docker-compose.yml    # tüm servisler
├── .env.example          # kök ortam şablonu (Compose + lokal Prisma)
└── README.md
```

---

## Geliştirme Komutları

### Tam stack (önerilen)
Kök dizinde: `cp .env.example .env` → `docker compose up --build` (yukarıdaki **Hızlı Başlangıç** ile aynı.)

### Backend (host’tan, Postgres/Redis zaten ayakta)
`DATABASE_URL` ve `REDIS_URL` host portlarına (5433, 6380) işaret etmeli — `.env.example` ile uyumludur.

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev    # veya: npm run prisma:migrate
npm run prisma:seed       # admin + örnek veri
npm run start:dev         # hot-reload, varsayılan http://localhost:4000
```

| Komut | Açıklama |
|-------|----------|
| `npm run test:unit` | Jest unit testleri — **Docker gerekmez** |
| `npm run test:e2e` | Supertest + gerçek `krontech_test` DB — **Postgres container** (`krontech_postgres`) çalışır olmalı |
| `npm test` | Önce unit, sonra e2e (CI’de yalnızca unit için `test:unit` kullanın) |

E2E öncesi: `docker compose up -d postgres redis`. İlk seferde `test/setup-e2e.ts` test veritabanını ve migration’ı hazırlar. Ayrıntı: `files/progress/ADIM_20_BACKEND_TESTS.md`.

### Frontend
```bash
cd frontend
npm install
# İsteğe bağlı: cp .env.example .env.local — NEXT_* ve REVALIDATION_SECRET
npm run dev               # http://localhost:3000
npm test                  # Jest
npm run build             # production derlemesi
npm run start             # build sonrası (production)
```

---

## Son kontrol (smoke)

Yayın veya büyük değişiklik öncesi hızlı doğrulama listesi: **`files/progress/ADIM_21_README_AND_CHECKS.md`**.

---

## Mimari Kararlar (Özet)

- **NestJS** seçildi: modüler yapı, dependency injection ve guard/interceptor desteği ile yetkilendirme/cache/audit log gibi ortak ihtiyaçları temiz çözer.
- **REST + Swagger** seçildi: ekibin tanıdık olduğu, sitenin public katmanı için yeterli; admin panel ile aynı API'yi paylaşmak kolay.
- **JWT** seçildi: stateless yapı CDN ve yatay ölçekleme dostu. Refresh token rotation yapılır; gerekirse Redis tabanlı blacklist eklenir.
- **Prisma** seçildi: type-safe, migration yönetimi otomatik, schema dosyası tek doğruluk kaynağı.
- **MinIO** seçildi: production'da AWS S3 / DigitalOcean Spaces / Cloudflare R2 gibi S3-uyumlu servislere geçiş kod değişikliği gerektirmez.
- **Jest + Supertest** seçildi: NestJS CLI ile uyumlu; **unit** testler mock ile hızlı, **e2e** testler gerçek PostgreSQL (`krontech_test`) üzerinde çalışır.

---

## Yayın & Cache Akışı

1. Editor admin panelden içeriği `Publish` eder
2. NestJS DB'yi günceller, `ContentVersion` kaydı oluşturur, `AuditLog` yazar
3. Redis'teki ilgili cache invalidate edilir
4. NestJS, Next.js'in `/api/revalidate` webhook'unu çağırır
5. Next.js `revalidatePath()` ile sayfayı yeniden üretir
6. Bir sonraki istek güncel veriyi alır

---

## Lisans

Proje değerlendirme amaçlıdır. Krontech marka adı ve görsel kimliği sahibine aittir.
