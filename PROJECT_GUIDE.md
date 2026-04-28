# Krontech Site — Proje Rehberi

> Bu dosya tek başına okunduğunda projeyi **anlayabilmen, ayağa kaldırabilmen ve test edebilmen** için her şeyi içerir. Hızlı başlamak istiyorsan **[Bölüm 3 — Hızlı başlangıç](#3-hızlı-başlangıç-tek-komut)** ile başla.

---

## İçindekiler

1. [Proje genel bakış](#1-proje-genel-bakış)
2. [Klasör yapısı](#2-klasör-yapısı)
3. [Hızlı başlangıç (tek komut)](#3-hızlı-başlangıç-tek-komut)
4. [Geliştirici modu (host’tan çalıştırma)](#4-geliştirici-modu-hosttan-çalıştırma)
5. [Servis adresleri ve giriş bilgileri](#5-servis-adresleri-ve-giriş-bilgileri)
6. [Manuel test rehberi (smoke)](#6-manuel-test-rehberi-smoke)
7. [Otomatik testler](#7-otomatik-testler)
8. [Yapıldı ✅ / Yapılmadı 🟡 listesi](#8-yapıldı--yapılmadı--listesi)
9. [Yaygın sorunlar ve çözümler](#9-yaygın-sorunlar-ve-çözümler)
10. [Daha fazla okuma](#10-daha-fazla-okuma)

---

## 1) Proje genel bakış

| Katman | Teknoloji |
|--------|-----------|
| Frontend | **Next.js 14** (App Router) + **TypeScript** + Tailwind |
| Backend | **NestJS 10** + **TypeScript** + Prisma |
| Veritabanı | **PostgreSQL 16** |
| Cache | **Redis 7** |
| Medya | **MinIO** (lokal — S3 uyumlu; üretimde gerçek S3 / R2 / Spaces) |
| Auth | **JWT** (access 15dk + refresh 7gün) + role bazlı koruma |
| Test | **Jest** + Supertest (backend), **Jest + Testing Library** (frontend) |
| Container | **Docker Compose** |

Public site **EN/TR çift dilli**. Admin panel `/admin` altında, **JWT cookie** ile korunur. İçerikler (ürün, blog, kaynak, ofis, duyuru, redirect, medya, kullanıcı) tamamı admin panelden yönetilir.

---

## 2) Klasör yapısı

```
Kron Site/
├── frontend/                  # Next.js 14 (App Router)
│   ├── app/                   # Public + admin route'ları
│   ├── components/            # UI bileşenleri (admin/, layout/, sections/, …)
│   ├── lib/                   # API client, auth, utils, i18n, schemas
│   └── __tests__/             # Jest testleri
├── backend/                   # NestJS API
│   ├── src/modules/           # Auth, Products, Blog, Resources, Forms, Media, …
│   ├── src/common/            # Cache, audit, S3, recaptcha, scheduler, revalidation
│   ├── prisma/                # schema.prisma + migrations + seed.ts
│   └── test/                  # Supertest e2e
├── files/
│   ├── PLAN.md                # Özgün plan
│   ├── ODEV.md                # Ödev tanımı
│   └── progress/ADIM_*.md     # Her adım için ilerleme notu
├── docker-compose.yml         # postgres, redis, minio, backend, frontend
├── .env.example               # Kök env şablonu (Compose + Prisma CLI host'tan)
├── README.md                  # Kısa özet
└── PROJECT_GUIDE.md           # ← bu dosya
```

---

## 3) Hızlı başlangıç (tek komut)

### Gereksinimler
- **Docker Desktop 24+** (Compose v2)
- Boş portlar: **3000, 4000, 5433, 6380, 9000, 9001**

### Adımlar

```bash
cd "/Users/merttugrul/Desktop/Kron Site"
cp .env.example .env
docker compose up --build
```

İlk kurulumda imajların inip build edilmesi 3–5 dakika sürebilir. Sonraki açılışlarda saniyeler.

> **`.env` dosyası neden gerekli?** Frontend ve backend container’ları içindeki secret’lar (JWT, S3, reCAPTCHA, revalidation) bu dosyadan okunur. Kullanıcı şifreleri, JWT secret’ları gibi değerleri **üretime alırken mutlaka değiştir**.

### Veritabanı seed

İlk açılışta admin kullanıcısı yoksa **manuel seed** çalıştır:

```bash
docker compose exec backend npm run prisma:seed
```

Bu, `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile admin kullanıcısını ve örnek içerikleri yaratır.

### Durdurma / temizleme

```bash
docker compose down              # container'ları kapat
docker compose down -v           # + volume'leri (DB, Redis, MinIO) sil
docker compose up --build -d     # arka planda yeniden başlat
```

---

## 4) Geliştirici modu (host’tan çalıştırma)

Yalnızca uygulamayı yazılımsal olarak değiştirmek istiyorsan; veritabanı/cache/medya container’da, kod **bilgisayarında** çalışsın.

### a) Altyapıyı aç

```bash
cd "/Users/merttugrul/Desktop/Kron Site"
docker compose up -d postgres redis minio
```

### b) Backend (yeni terminal)

```bash
cd "/Users/merttugrul/Desktop/Kron Site/backend"
npm install
npx prisma generate
npx prisma migrate dev          # ilk seferde
npm run prisma:seed             # admin + örnek veri
npm run start:dev               # http://localhost:4000
```

### c) Frontend (yeni terminal)

```bash
cd "/Users/merttugrul/Desktop/Kron Site/frontend"
npm install
# yoksa:
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

`frontend/.env.local` içindeki **`NEXT_PUBLIC_API_URL`** mutlaka `http://localhost:4000` olmalı (host’ta çalışıyorsan).

---

## 5) Servis adresleri ve giriş bilgileri

| Servis | URL / Port | Notlar |
|--------|-----------|--------|
| Site (Next.js) | http://localhost:3000 | EN |
| Site (TR) | http://localhost:3000/tr | TR |
| Backend API | http://localhost:4000/api | Tüm endpoint’ler `/api` ile başlar |
| Health | http://localhost:4000/health | Prefix dışı; 200 dönerse API ayakta |
| Swagger | http://localhost:4000/api/docs | Tüm endpoint’ler + DTO’lar |
| Admin paneli | http://localhost:3000/admin | JWT cookie |
| MinIO konsol | http://localhost:9001 | `minioadmin` / `minioadmin` |
| MinIO API | http://localhost:9000 | S3 uyumlu |
| PostgreSQL | localhost **5433** | DB: `krontech` · user: `krontech` · pass: `password` |
| Redis | localhost **6380** | dev db=0, test db=1 |

### Admin giriş

`.env` içindeki **`ADMIN_EMAIL`** ve **`ADMIN_PASSWORD`** ile (varsayılan):

- E-posta: `admin@krontech.com`
- Şifre: `Admin123!`

Seed çalışırken bu kullanıcı yaratılır. Şifre güçlüyse (en az 8) işe yarar.

---

## 6) Manuel test rehberi (smoke)

Sırayla geç → her bir bölüm yeşilse uygulama beklendiği gibi çalışıyor demektir.

### 6.1 API ayakta mı

- `curl http://localhost:4000/health` → `{ "status": "ok", ... }`
- `http://localhost:4000/api/docs` → Swagger açılıyor

### 6.2 Public site

- `/` → ana sayfa açılıyor, **announcement bar** (varsa) görünüyor.
- Sağ üstten **EN ↔ TR** geçişi → URL ve içerik dile uygun.
- `/products/[slug]` (örn. seed’den biri) → ürün detay (hero, solution, benefits…)
- `/blog` ve `/blog/[slug]` → blog listesi/detay; ilgili yazıyı aç.
- `/resources` ve `/resources/[id]` → kaynak listesi + datasheet/case-study indirme.
- `/contact` → form alanları görünüyor (reCAPTCHA anahtarı yoksa form yine submit olabilir, backend test modunda doğrulamayı atlayabilir).

### 6.3 Admin paneli

`http://localhost:3000/admin` → login formu.

- Hatalı şifre → kibar hata mesajı.
- Doğru bilgilerle giriş → **dashboard** (ürün/blog/kaynak/medya/form sayaçları).
- Sol menüden bir modüle gir, **+ Yeni** ile bir kayıt oluştur, **Düzenle**, **Yayına al / Taslağa çek**, **Sil**.
- **Media Library**: bir görsel sürükle/yükle → grid’de göründüğünü, alt-text düzenleyebildiğini doğrula.
- **Form gönderileri**: Public siteden bir contact formu doldur → admin panelde detayını aç.
- **Kullanıcılar** (yalnızca admin rolü): yeni kullanıcı oluştur (editor) → o kullanıcı ile giriş yap, **Kullanıcılar** menüsünün **görünmediğini** doğrula.

### 6.4 SEO/teknik

- `http://localhost:3000/sitemap.xml` → XML dönüyor.
- `http://localhost:3000/robots.txt` → robots dönüyor.
- View source → `<script type="application/ld+json">` (Organization/WebSite + sayfa şemaları).
- Bir admin redirect ekle (örn. `/eski` → `/yeni`) → tarayıcıda `/eski` adresine git → middleware doğru yere yönlendiriyor.

### 6.5 Cache + revalidation

- Bir blog yazısını **yayına al** → site tarafında o sayfa bir sonraki ziyarette güncel.
- Backend log’unda `Revalidate OK …` mesajı görmelisin.

---

## 7) Otomatik testler

### 7.1 Frontend (Jest + Testing Library)

```bash
cd "/Users/merttugrul/Desktop/Kron Site/frontend"
npm test                # tüm jest testleri (~25 paket, 161+ test)
npm run build           # tip + lint + production build
```

### 7.2 Backend — sadece unit (Docker gerekmez)

```bash
cd "/Users/merttugrul/Desktop/Kron Site/backend"
npm run test:unit       # 167 test, mock’larla, hızlı
```

### 7.3 Backend — e2e (gerçek Postgres + Redis lazım)

Postgres container’ı çalışıyor olmalı:

```bash
docker compose up -d postgres redis
cd "/Users/merttugrul/Desktop/Kron Site/backend"
npm run test:e2e        # Supertest + krontech_test DB
```

İlk çalıştırmada `test/setup-e2e.ts` test veritabanını yaratıp migration’ı uygular.

### 7.4 Hepsi (CI tarzı)

```bash
# backend
cd backend && npm run test:unit && npm run build
# frontend
cd ../frontend && npm test && npm run build
```

---

## 8) Yapıldı ✅ / Yapılmadı 🟡 listesi

### ✅ Tamamlanan adımlar

| # | Konu | Doküman |
|---|------|---------|
| 1 | Docker Compose iskeleti | `files/progress/ADIM_01_DOCKER.md` |
| 2 | NestJS backend bootstrap | `ADIM_02_NESTJS.md` |
| 3 | Prisma schema + seed | `ADIM_03_PRISMA.md` |
| 4 | Auth (JWT access + refresh, roles) | `ADIM_04_AUTH.md` |
| 5 | Products (CRUD + lifecycle) | `ADIM_05_PRODUCTS.md` |
| 5b | Test altyapısı | `ADIM_05b_TEST_INFRASTRUCTURE.md` |
| 6 | Blog (FAQ + view count) | `ADIM_06_BLOG.md` |
| 7 | Resources, Media (presign), Forms (reCAPTCHA) | `ADIM_07_RESOURCES_MEDIA_FORMS.md` |
| 8 | Redirects, Announcement bar, Offices | `ADIM_08_REDIRECTS_ANNOUNCEMENT_OFFICES.md` |
| 9 | Sitemap + revalidation + scheduled publish | `ADIM_09_SITEMAP_REVALIDATION_CRON.md` |
| 10 | Next.js iskeleti (App Router) | `ADIM_10_FRONTEND_SETUP.md` |
| 11 | Tailwind + Krontech palette | `ADIM_11_TAILWIND_BRAND.md` |
| 12 | Layout (Navbar, Footer, AnnouncementBar) | `ADIM_12_LAYOUT_COMPONENTS.md` |
| 13 | Ana sayfa | `ADIM_13_HOME_PAGE.md` |
| 14 | Ürün detay (zod, JSON-LD) | `ADIM_14_PRODUCT_DETAIL.md` |
| 15 | Blog listele/detay | `ADIM_15_BLOG_PAGES.md` |
| 16 | Kaynaklar (datasheet/casestudy/whitepaper) | `ADIM_16_RESOURCES_PAGES.md` |
| 17 | Contact + Demo formları (RHF + zod + reCAPTCHA) | `ADIM_17_CONTACT_FORMS.md` |
| 18 | SEO (robots, sitemap proxy, JSON-LD, middleware) | `ADIM_18_SEO.md` |
| 19 (FAZ 1) | Admin panel: auth, layout, Products, Blog, shared UI | `ADIM_19_ADMIN_PANEL_PHASE1.md` |
| 19 (FAZ 2) | Admin panel: Resources, Forms, Redirects, Announcement, Offices, Media, Users | `ADIM_19_ADMIN_PANEL_PHASE2.md` |
| 20 | Backend testler (unit + e2e + users e2e) | `ADIM_20_BACKEND_TESTS.md` |
| 21 | README + smoke + bu rehber | `ADIM_21_README_AND_CHECKS.md` |

**Test sayıları:**
- Backend unit: **167** test geçer
- Backend e2e: 12 paket (Postgres açıkken hepsi geçer)
- Frontend Jest: **161+** test geçer

### 🟡 Bilinçli olarak kapsam dışı / sonraya bırakılan

Aşağıdakiler bu repoda **yok** — yayına çıkarken eklenmesi gerekir:

- **Üretim deploy:** sunucu seçimi, domain, **HTTPS sertifikası**, reverse proxy (Nginx/Traefik), CI/CD pipeline.
- **Yedekleme:** PostgreSQL otomatik backup + S3’e snapshot.
- **İzleme & log:** Sentry / OpenTelemetry / metric/dashboard.
- **E-posta gönderimi:** form submission’larında bildirim e-postası (SMTP / Postmark / SES).
- **reCAPTCHA üretim anahtarı:** lokalde test-key ile çalışır; üretimde Google’dan v3 site key + secret alınmalı.
- **S3 üretim:** MinIO yerine AWS S3 / Cloudflare R2; `.env` içinde endpoint/key güncellenir, kod değişmez.
- **Tam tarayıcı E2E (Playwright/Cypress):** mevcut testler unit + Supertest seviyesinde; tarayıcı otomasyonu eklenebilir.
- **Çok kullanıcılı içerik kilidi (concurrent editing):** aynı içeriği iki editör eş zamanlı değiştirirse son kaydeden kazanır.
- **i18n metin yönetimi UI:** i18n dictionary kodda; admin panelden değiştirilemez (planlı genişleme).

---

## 9) Yaygın sorunlar ve çözümler

| Belirti | Sebep | Çözüm |
|---------|-------|-------|
| `docker compose up` portu kullanıyor | 3000/4000/5433/6380/9000/9001 başka servis tarafından tutuluyor | Çakışan servisi durdur veya `docker-compose.yml` portunu değiştir |
| Backend `ECONNREFUSED postgres:5432` | Postgres henüz hazır değil | `docker compose up -d postgres` çalıştır, `pg_isready` healthy olunca tekrar dene |
| Admin login `Invalid email or password` | Seed çalışmadı veya farklı `.env` | `docker compose exec backend npm run prisma:seed` |
| Admin formda `403` | Editor rolüyle admin-only endpoint’e gidiyorsun (örn. Users) | Admin kullanıcıyla giriş yap |
| MinIO upload `signature mismatch` | `S3_PUBLIC_ENDPOINT` host’tan farklı | `.env`’de `S3_ENDPOINT=http://localhost:9000` (host’tan çalışıyorsan) |
| reCAPTCHA hatası lokalde | Anahtar yok | `.env`’de boş bırak; `NODE_ENV=development/test` ise verifier skip eder |
| `npm run test:e2e` `Postgres container çalışmıyor` | Compose ayağa kalkmadı | `docker compose up -d postgres redis` |
| Next.js build’de `typedRoutes` hatası | Yanlış href’li `Link` | Hatalı route’u literal string yap veya `as never` cast’ini kontrol et |

---

## 10) Daha fazla okuma

- **Plan / mimari kararlar:** `files/PLAN.md`
- **Ödev tanımı:** `files/ODEV.md`
- **Test stratejisi:** `files/progress/TEST_STRATEGY.md`
- **Adım adım ilerleme notları:** `files/progress/ADIM_*.md`
- **Kısa README:** kökteki `README.md`
- **Smoke checklist:** `files/progress/ADIM_21_README_AND_CHECKS.md`

---

### Tek satır özet

```bash
cp .env.example .env && docker compose up --build
# sonra: http://localhost:3000  ·  http://localhost:3000/admin (admin@krontech.com / Admin123!)
```

İyi geliştirmeler! Bir adımda takılırsan ilgili `files/progress/ADIM_*.md` dosyası **o aşamanın “neden böyle yapıldı”** notlarını içerir.
