# Cursor Prompt'ları — Adım Adım

Her prompt'u sırasıyla Cursor'a gir.
Bir adım bitmeden diğerine geçme.
Her adımdan sonra kodu test et.

---

## ADIM 1 — Docker Compose Kurulumu

```
Bir krontech adında proje klasörü içinde aşağıdaki yapıyı oluştur:

krontech/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env.example
└── README.md

docker-compose.yml içine şu servisleri ekle:
- postgres: image postgres:16, port 5432, env POSTGRES_USER=krontech POSTGRES_PASSWORD=password POSTGRES_DB=krontech, volume ile kalıcı veri
- redis: image redis:7-alpine, port 6379
- minio: image minio/minio, port 9000 ve 9001, MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin, command: server /data --console-address ":9001"
- backend: build ./backend, port 4000, depends_on postgres ve redis
- frontend: build ./frontend, port 3000, depends_on backend

.env.example dosyasına şunları ekle:
DATABASE_URL=postgresql://krontech:password@postgres:5432/krontech
REDIS_URL=redis://redis:6379
JWT_SECRET=supersecretjwtkey
JWT_REFRESH_SECRET=supersecretrefreshkey
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
S3_ENDPOINT=http://minio:9000
S3_BUCKET=krontech-media
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
RECAPTCHA_SECRET=your_recaptcha_secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
NEXT_PUBLIC_API_URL=http://localhost:4000
REVALIDATION_SECRET=revalidationsecret
ADMIN_EMAIL=admin@krontech.com
ADMIN_PASSWORD=Admin123!
```

---

## ADIM 2 — NestJS Backend Kurulumu

```
backend/ klasörü içinde NestJS projesi kur. TypeScript strict mode açık olsun, any kullanma.

Gerekli paketleri yükle:
- @nestjs/config
- @nestjs/jwt
- @nestjs/passport
- passport-jwt
- @prisma/client
- prisma
- bcrypt
- @types/bcrypt
- class-validator
- class-transformer
- @nestjs/swagger
- swagger-ui-express
- ioredis
- @aws-sdk/client-s3
- @aws-sdk/s3-request-presigner
- axios (reCAPTCHA doğrulama için)

Klasör yapısı:
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── products/
│   │   ├── blog/
│   │   ├── resources/
│   │   ├── media/
│   │   ├── forms/
│   │   ├── redirects/
│   │   ├── announcement/
│   │   └── offices/
│   ├── common/
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── interceptors/
│   ├── prisma/
│   └── main.ts
├── prisma/
│   └── schema.prisma  (ayrıca verilen dosyadan kopyala)
└── Dockerfile

main.ts içinde:
- Swagger kurulumu: /api/docs path'inde
- ValidationPipe global
- CORS açık
- Rate limiting: @nestjs/throttler ile global olarak dakikada 60 istek
```

---

## ADIM 3 — Prisma Setup ve Seed

```
backend/prisma/schema.prisma dosyasını oluştur.
Aşağıdaki modelleri ekle (hepsini eksiksiz):

- User (id, email, passwordHash, role: admin|editor, isActive, createdAt, updatedAt)
- ProductCategory + ProductCategoryTranslation
- Product + ProductTranslation (status: draft|published|scheduled, publishedAt, solution Json, howItWorks Json, keyBenefits Json, videos Json, SEO alanları)
- BlogPost + BlogPostTranslation (type: blog|news, isHighlight, faqItems Json, SEO alanları)
- Resource (type: datasheet|casestudy|whitepaper, productId nullable FK, fileUrl, locale)
- Testimonial (productId FK, companyName, companyLogo, quote, personName, personTitle)
- Office (city, email, phone, fax nullable, address, image, imagePosition, order, locale)
- AnnouncementBar (locale, text, linkUrl, linkLabel, isActive, startDate, endDate)
- FormSubmission (formType: contact|demo, data Json, ipAddress, userAgent)
- Media (filename, originalName, url, mimeType, size, altText, uploadedBy)
- Redirect (fromPath unique, toPath, statusCode: 301|302, isActive)
- AuditLog (userId nullable FK, action, entityType, entityId, oldData Json, newData Json)
- ContentVersion (entityType, entityId, version, data Json, createdBy nullable FK)

Sonra backend/prisma/seed.ts dosyası oluştur:
- Admin kullanıcısı: email ve password .env'den al, bcrypt ile hash'le
- Birkaç örnek ProductCategory (Identity & Access Management, Data Security, Telco Solutions)
- Örnek bir Product (kron-pam) ve ProductTranslation (en ve tr)
- Örnek 2-3 BlogPost
- Örnek Office verileri (Istanbul, USA, Ankara, Izmir)

package.json'a ekle: "prisma": { "seed": "ts-node prisma/seed.ts" }
```

---

## ADIM 4 — Auth Modülü

```
backend/src/modules/auth/ altında auth modülü oluştur.

AuthService içinde şu metodlar olsun:
- validateUser(email, password): email ile kullanıcıyı bul, bcrypt.compare ile şifre doğrula
- login(user): access token (15dk) ve refresh token (7gün) üret, her ikisi de JWT
- refreshToken(refreshToken): refresh token doğrula, yeni access token üret

AuthController:
- POST /auth/login — body: {email, password}, LoginDto class-validator ile validate et
- POST /auth/refresh — body: {refreshToken}
- GET /auth/me — JwtAuthGuard ile korumalı, mevcut kullanıcıyı döner

JwtAuthGuard ve JwtStrategy oluştur (passport-jwt kullan)
RolesGuard ve @Roles() decorator oluştur (admin, editor kontrolü için)

Tüm endpoint'leri Swagger @ApiOperation ve @ApiResponse ile dokümante et.
any kullanma, tüm DTO'lar typed olsun.
```

---

## ADIM 5 — Products Modülü

```
backend/src/modules/products/ altında products modülü oluştur.

ProductsService metodları:
- findAll(locale: string, status?: ContentStatus): ürün listesi + çevirisi
- findBySlug(slug: string, locale: string): tekil ürün + çevirisi
- create(dto: CreateProductDto): yeni ürün + çeviri oluştur
- update(id: string, dto: UpdateProductDto): güncelle
- delete(id: string): sil (admin only)
- publish(id: string): status'u published yap, publishedAt'i şimdiki zaman yap, ContentVersion kaydı oluştur, AuditLog yaz
- schedule(id: string, publishAt: Date): zamanlanmış yayın

ProductsController endpoint'leri:
- GET /products?locale=en&status=published — Public
- GET /products/:slug?locale=en — Public
- POST /products — JwtAuthGuard + Roles(admin, editor)
- PUT /products/:id — JwtAuthGuard + Roles(admin, editor)
- DELETE /products/:id — JwtAuthGuard + Roles(admin)
- POST /products/:id/publish — JwtAuthGuard + Roles(admin, editor)
- POST /products/:id/schedule — JwtAuthGuard + Roles(admin, editor)

DTO'lar:
- CreateProductDto: slug, categoryId optional, translations: [{locale, title, shortDescription, solution, howItWorks, keyBenefits, videos, metaTitle, metaDescription, ...}]
- UpdateProductDto: Partial<CreateProductDto>

Tümü Swagger ile dokümante et.
```

---

## ADIM 6 — Blog Modülü

```
backend/src/modules/blog/ altında blog modülü oluştur.

BlogService metodları:
- findAll(locale: string, type?: PostType, page: number, limit: number): sayfalı blog listesi
- findHighlights(locale: string): isHighlight=true olan bloglar (sidebar için)
- findBySlug(slug: string, locale: string): tekil blog + çevirisi
- create(dto: CreateBlogPostDto)
- update(id: string, dto: UpdateBlogPostDto)
- delete(id: string)
- publish(id: string): ContentVersion + AuditLog

BlogController endpoint'leri:
- GET /blog?locale=en&type=blog&page=1&limit=5 — Public
- GET /blog/highlights?locale=en — Public (sidebar için)
- GET /blog/:slug?locale=en — Public
- POST /blog — JwtAuthGuard + Roles(admin, editor)
- PUT /blog/:id — JwtAuthGuard + Roles(admin, editor)
- DELETE /blog/:id — JwtAuthGuard + Roles(admin)
- POST /blog/:id/publish — JwtAuthGuard + Roles(admin, editor)

DTO'larda faqItems: {question: string, answer: string}[] tipinde olsun.
```

---

## ADIM 7 — Resources, Media, Forms Modülleri

```
3 modülü birlikte oluştur:

### Resources Modülü
- GET /resources?type=datasheet&locale=en — Public
- GET /resources?productSlug=kron-pam&locale=en — Public (ürün sayfası resources tab için)
- POST/PUT/DELETE /resources — Admin/Editor
Prisma: Resource modeli, productId nullable FK

### Media Modülü
- POST /media/upload — multipart/form-data, dosyayı S3/MinIO'ya yükle, Media kaydı oluştur, URL döndür
- GET /media — Admin/Editor, sayfalı liste
- DELETE /media/:id — Admin only, S3'ten de sil

S3 için @aws-sdk/client-s3 kullan. Endpoint .env'den al (MinIO için http://minio:9000).
Desteklenen formatlar: jpg, jpeg, png, webp, svg, pdf

### Forms Modülü
- POST /forms/submit — Public
  body: {formType: 'contact'|'demo', data: {...}}
  1. Google reCAPTCHA doğrula (axios ile https://www.google.com/recaptcha/api/siteverify)
  2. Validasyon: formType'a göre zorunlu alanları kontrol et
  3. FormSubmission tablosuna kaydet
  4. 200 döndür

- GET /forms/:type/submissions?page=1&limit=20 — Admin only
- GET /forms/:type/submissions/export — Admin only, CSV formatında döndür
```

---

## ADIM 8 — Redirect, Announcement, Offices Modülleri

```
3 küçük modül:

### Redirects Modülü
- GET /redirects — Admin
- POST /redirects — Admin, body: {fromPath, toPath, statusCode: 301|302}
- PUT /redirects/:id — Admin
- DELETE /redirects/:id — Admin

### Announcement Modülü
- GET /announcement?locale=en — Public
  Aktif (isActive=true) ve tarihi geçerli (startDate <= now <= endDate) bar'ı döndür
- POST/PUT/DELETE /announcement — Admin

### Offices Modülü
- GET /offices?locale=en — Public, order'a göre sıralı
- POST/PUT/DELETE /offices — Admin
```

---

## ADIM 9 — Sitemap ve Revalidation

```
### Sitemap
GET /sitemap endpoint'i XML döndürsün:
- Tüm published Product'ların slug'ları
- Tüm published BlogPost'ların slug'ları  
- Statik sayfalar: /, /blog, /cybersecurity-resources, /case-studies, /contact
- Her URL için EN ve TR versiyonu
- <lastmod> olarak updatedAt kullan

### Revalidation Webhook
POST /revalidate endpoint'i:
- Header'da x-revalidation-secret kontrolü yap (.env'deki REVALIDATION_SECRET ile)
- Body: {path: string} — revalidate edilecek sayfa
- Bu endpoint Next.js'in /api/revalidate route'unu çağırmaz, sadece loglama yapar
  (Next.js kendi içinde revalidatePath kullanır)

### Next.js Revalidation API Route
frontend/app/api/revalidate/route.ts oluştur:
- POST isteği al
- x-revalidation-secret header kontrolü
- body'den path al
- revalidatePath(path) çağır
- {revalidated: true} döndür
```

---

## ADIM 10 — Next.js Frontend Kurulumu

```
frontend/ klasöründe Next.js 14 projesi kur:
- App Router kullan
- TypeScript strict mode
- Tailwind CSS
- next/font ile font kurulumu

Gerekli paketler:
- @tanstack/react-query (API state management için)
- react-hook-form
- zod (form validasyon)
- @hookform/resolvers
- react-google-recaptcha
- react-google-recaptcha-v2
- swiper (carousel için)
- axios

Klasör yapısı:
frontend/
├── app/
│   ├── layout.tsx (root layout, AnnouncementBar + Navbar + Footer)
│   ├── page.tsx (ana sayfa)
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx — olmaz, blog detay app/[slug]/page.tsx'de
│   ├── [slug]/page.tsx (blog detay)
│   ├── [productSlug]/page.tsx (ürün detay)
│   ├── cybersecurity-resources/page.tsx
│   ├── kron-pam-resources/page.tsx
│   ├── case-studies/page.tsx
│   ├── contact/page.tsx
│   ├── tr/ (türkçe sayfalar)
│   │   ├── page.tsx
│   │   ├── blog/page.tsx
│   │   └── ...
│   ├── admin/ (admin panel, CSR)
│   │   └── ...
│   ├── api/
│   │   └── revalidate/route.ts
│   └── sitemap.ts
├── components/
│   ├── layout/
│   │   ├── AnnouncementBar.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Breadcrumb.tsx
│   ├── home/
│   │   ├── HeroSlider.tsx
│   │   ├── ProductsSection.tsx
│   │   ├── WhyKron.tsx
│   │   ├── StatsSection.tsx
│   │   ├── CaseStudyHighlight.tsx
│   │   └── BlogFeed.tsx
│   ├── product/
│   │   ├── ProductHero.tsx
│   │   ├── ProductTabMenu.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── TestimonialCarousel.tsx
│   │   └── CaseStudyBlock.tsx
│   ├── blog/
│   │   ├── BlogCard.tsx
│   │   ├── BlogSidebar.tsx
│   │   └── FAQAccordion.tsx
│   ├── resources/
│   │   ├── ResourceCard.tsx
│   │   └── CaseStudyCard.tsx
│   ├── contact/
│   │   ├── ContactForm.tsx
│   │   └── OfficeCard.tsx
│   └── shared/
│       ├── ContactBanner.tsx
│       └── ProductCard.tsx
├── lib/
│   ├── api.ts (axios instance)
│   ├── types.ts (tüm TypeScript tipleri)
│   └── utils.ts
└── public/
```

---

## ADIM 11 — Krontech Renk Paleti ve Tailwind Config

```
tailwind.config.ts dosyasını oluştur ve Krontech'in renk paletini ekle:

colors:
  kron:
    navy: '#0a1628'      // koyu lacivert (hero arka planı)
    blue: '#1e3a8a'      // koyu mavi (button, başlık)
    accent: '#2563eb'    // parlak mavi (highlight, CTA)
    light: '#3b82f6'     // açık mavi (link, hover)
    gray: '#f8fafc'      // çok açık gri (arka plan)
    dark: '#0f172a'      // çok koyu (footer)

Typography:
- Font: Inter veya sistem font stack
- Heading highlight efekti: mavi altı çizili kelimeler (örn: "Kron Telemetry Pipeline" da "Telemetry Pipeline" mavi)

Responsive breakpoints standart Tailwind kullan (sm, md, lg, xl)
```

---

## ADIM 12 — Layout Componentleri

```
Şu 3 layout componentini oluştur:

### AnnouncementBar.tsx
- Backend'den GET /announcement?locale=en çek
- Mavi arka plan, beyaz yazı, sağda "Register Now" butonu
- Eğer aktif bar yoksa render etme

### Navbar.tsx
Props: locale ('en' | 'tr')

EN menüsü:
- Products (mega menü: Identity & Access Management, Data Security & Data Management, Telco Solutions alt kategorileriyle)
- Solutions (mega menü: Security Use Cases, Telecom Use Cases, Data Management)
- Partners
- Resources
- About Us
- Contact
- Dil switcher: EN / TR
- Arama ikonu

TR menüsü:
- Ürünler (aynı ürünler)
- Sektörler (Telekom, Finans, Enerji, Kamu) — EN'den FARKLI!
- İş Ortaklığı
- Kaynaklar
- Hakkımızda
- İletişim

Sticky olsun (top-0 fixed)
Beyaz arka plan, logo solda
Mega menü hover'da açılsın

### Footer.tsx
4 kolon:
1. Products: Kron PAM, Network Performance Monitoring, Authentication/Authorization/Accounting, IPDR Logging, Quality Assurance
2. Sectors: Energy, Finance, Government, Telecom
3. About Us: Management, Board of Directors, Human Resources, Newsroom, Announcements, Awards
4. Social Media: LinkedIn, Twitter/X, Instagram, YouTube (ikonlarla)

Alt bar: Copyright + Information Society Services + Privacy Policy + Information Note + Cookie Policy
```

---

## ADIM 13 — Ana Sayfa

```
app/page.tsx oluştur. ISR, revalidate: 3600.

Sırasıyla şu componentleri render et:
1. HeroSlider — DB'den ürün slider verilerini çek, dönen carousel
   Her slide: koyu lacivert arka plan, sol metin (büyük başlık, açıklama, CTA), sağ görsel/animasyon
   
2. ProductsSection — "Kron Products" başlığı, 8 ürün kartı carousel (sol/sağ ok)
   Her kart: ürün görseli/ikonu, başlık, 3-4 bullet özellik, "Learn More" butonu
   
3. WhyKron — koyu lacivert arka plan, sol: "Why Kron?" metin + Learn More, sağ: analist rozetleri
   
4. StatsSection — 4 istatistik: 6 Continents, 35+ Countries, 200+ Partners, 1500+ Deployments
   Her birinde ikon + sayı + label
   
5. CaseStudyHighlight — koyu mavi arka plan, sol: bullet listesi, sağ: başlık + açıklama + CTA
   
6. BlogFeed — "Keep up to Date" başlığı, blog+haber carousel
   Her kart: kapak görseli, tip etiketi (Blog/News), başlık, tarih, "Read More"
   
7. ContactBanner

Veri çekme:
- Ürünler: fetch(`${API_URL}/products?locale=en&status=published`)
- Blog: fetch(`${API_URL}/blog?locale=en&limit=10`)
- Announcement: fetch(`${API_URL}/announcement?locale=en`)

generateMetadata ile SEO meta tag'leri ekle.
Organization schema.org JSON-LD ekle.
```

---

## ADIM 14 — Ürün Detay Sayfası

```
app/[productSlug]/page.tsx oluştur. ISR, revalidate: 1800.

generateStaticParams: tüm product slug'larını döndür.
generateMetadata: ürünün metaTitle, metaDescription, ogImage, canonicalUrl, hreflang kullan.

Sırasıyla:
1. ProductHero — ürün başlığı, kısa açıklama, "Download Datasheet" + "Request a Demo" butonları
   Arka plan: koyu lacivert + binary kod görseli

2. ProductTabMenu — sticky, 6 tab: Solution | How It Works | Key Benefits | Product Family | Resources | Videos
   Tab'a tıklayınca ilgili section'a smooth scroll

3. Breadcrumb — Home > [Kategori] > [Ürün Adı]
   BreadcrumbList schema.org JSON-LD ekle

4. FeatureSections (solution tab içeriği) — alternating layout:
   - Bölüm 1: Sol metin (başlık mavi highlight ile, paragraf) + Sağ görsel
   - Bölüm 2: Sol görsel + Sağ metin
   - ... devam eder

5. TestimonialCarousel — mavi arka plan, müşteri alıntıları, sol/sağ ok navigasyon

6. CaseStudyBlock — video thumbnail (play butonu) + müşteri hikayesi metni + CTA

7. ContactBanner

Product schema.org JSON-LD ekle.

Ürün bulunamazsa notFound() çağır.
```

---

## ADIM 15 — Blog Sayfaları

```
### Blog Liste: app/blog/page.tsx — ISR revalidate: 600

Layout: 2 kolonlu (sol geniş, sağ dar sidebar)

Sol:
- Kısa hero banner (koyu, "Blog" yazısı)
- Breadcrumb: Home > Blog  
- Blog kartları dikey liste (büyük kapak görseli + başlık + özet + tarih + "Read More →")
- Sayfalama: ?page=1 query param ile, 5 yazı/sayfa

Sağ sidebar (sticky):
- "Highlights" başlığı
- isHighlight=true olan 8 blog: thumbnail + başlık + tarih

Veri: GET /blog?locale=en&page=1&limit=5
Highlights: GET /blog/highlights?locale=en

### Blog Detay: app/[slug]/page.tsx — ISR revalidate: 3600
NOT: [slug] ve [productSlug] çakışabilir. Middleware veya generateStaticParams ile çöz.
Çözüm: önce product slug'larını dene, yoksa blog slug'larını dene.

Layout: 2 kolonlu (sol geniş, sağ dar sidebar)

Sol:
- Tam genişlik kapak görseli
- Başlık (büyük, siyah)
- Tarih + yazar adı
- Sosyal paylaşım: LinkedIn, Facebook, Twitter ikonları (harici link)
- Rich text içerik (dangerouslySetInnerHTML veya HTML parser)
- FAQAccordion — accordion'da FAQ soruları (+ ikonu ile açılır/kapanır)

Sağ: aynı Highlights sidebar

generateMetadata ile SEO.
Article schema.org JSON-LD.
FAQPage schema.org JSON-LD (faqItems varsa).
```

---

## ADIM 16 — Kaynaklar Sayfaları

```
### Kaynaklar Hub: app/cybersecurity-resources/page.tsx — ISR revalidate: 3600

Bölümler:
1. Kısa hero banner (görsel kolaj)
2. Breadcrumb: Home > Cybersecurity Resources
3. "Cybersecurity Resources" başlığı + alt başlık
4. 3'lü kart grid:
   - Case Studies kartı: görsel + "CASE STUDIES" başlık + açıklama + "Discover More" butonu → /case-studies
   - Resources kartı: → /kron-pam-resources
   - Blog kartı: → /blog
5. ContactBanner + Footer

### Datasheet'ler: app/kron-pam-resources/page.tsx — ISR revalidate: 3600
NOT: Bu aynı zamanda Kron PAM sayfasının Resources tab'ı.

1. ProductHero (kron-pam ürününün hero'su)
2. ProductTabMenu (Resources tab aktif)
3. Breadcrumb: Home > Identity & Access Management > Kron PAM > Resources
4. Intro bölümü: Sol metin + Sağ görsel
5. Datasheet grid (3'lü):
   Her kart: PDF kapak önizleme görseli + ürün adı + "Download" butonu
   Download butonuna tıklayınca PDF indirilsin (target="_blank")
6. ContactBanner + Footer

Veri: GET /resources?type=datasheet&locale=en&productSlug=kron-pam

### Case Studies: app/case-studies/page.tsx — ISR revalidate: 3600
1. Hero banner
2. Breadcrumb: Home > Case Studies
3. "Privileged Access Management Case Studies" başlığı + alt başlık
4. 3'lü grid: Her kart: görsel + BÜYÜK HARF MAVİ başlık + açıklama + "Download" butonu
5. ContactBanner + Footer

Veri: GET /resources?type=casestudy&locale=en
```

---

## ADIM 17 — Contact Sayfası ve Form

```
app/contact/page.tsx — Static (revalidate: false)

Bölümler:
1. Hero banner — iletişim ikonları görseli
2. Breadcrumb: Home > Contact
3. Ana ContactForm componenti (detay aşağıda)
4. Ofis bilgileri (GET /offices?locale=en'den çek):
   - İstanbul HQ — Sol görsel, Sağ bilgiler
   - USA — Sol bilgiler, Sağ görsel
   - Ankara — Sol görsel, Sağ bilgiler
   - İzmir — Sol bilgiler, Sağ görsel
5. ContactBanner + Footer

### ContactForm.tsx (Client Component — 'use client')
React Hook Form + Zod validasyon:
formType prop'u al: 'contact' | 'demo'

Contact form alanları:
- firstName (required), lastName (required)
- email (required, email format), jobTitle (required)
- department (required, dropdown: IT/Security/Finance/Other)
- company (required)
- country (required, dropdown + bayrak)
- phone (required)
- callAssistance (dropdown: Yes/No)
- subject (required)
- message (required, min 10 karakter, textarea)
- kvkk1 (required boolean)
- kvkk2 (optional boolean)
- reCAPTCHA token

Demo form alanları (subset):
- firstName, lastName, company, email, country, phone, kvkk1, kvkk2, reCAPTCHA

Submit handler:
1. reCAPTCHA token al (react-google-recaptcha)
2. POST /forms/submit gönder
3. Başarılı: "Thank you" mesajı göster
4. Hata: error mesajı göster

Client-side validasyon Zod ile, server-side NestJS class-validator ile.
```

---

## ADIM 18 — SEO Altyapısı

```
### app/sitemap.ts
Next.js sitemap generator:
- Tüm published product slug'larını çek → EN + TR URL
- Tüm published blog slug'larını çek → EN + TR URL
- Statik sayfaları ekle: /, /blog, /cybersecurity-resources, /case-studies, /contact
- MetadataRoute.Sitemap tipinde döndür

### app/robots.ts
- Allow: /
- Disallow: /admin, /api
- Sitemap: https://krontech.com/sitemap.xml

### Shared Structured Data (lib/structuredData.ts)
organizationSchema: şirket bilgileri (ana sayfa için)
productSchema(product): ürün bilgileri
articleSchema(post): blog yazısı
faqSchema(items): FAQ accordion
breadcrumbSchema(items): breadcrumb

Her sayfada:
<script type="application/ld+json">
  {JSON.stringify(schema)}
</script>

### middleware.ts (root'ta)
- Tüm request'lerde DB'deki aktif Redirect'leri kontrol et
- Eşleşen fromPath varsa statusCode ile yönlendir
- Not: Her request'te DB sorgusu yapmak yerine Redis'te redirect listesini cache'le (5dk TTL)
```

---

## ADIM 19 — Admin Panel (Temel)

```
app/admin/ altında basit admin panel oluştur. CSR (Client-side rendering).

Sayfalar:
- /admin/login — email + şifre formu, POST /auth/login, token'ı cookie'ye kaydet
- /admin — dashboard (özet istatistikler)
- /admin/products — ürün listesi + yeni ürün butonu
- /admin/products/new — yeni ürün formu
- /admin/products/[id]/edit — düzenleme formu
- /admin/blog — blog listesi
- /admin/blog/new — yeni blog formu
- /admin/blog/[id]/edit — düzenleme
- /admin/resources — kaynak listesi + yükleme
- /admin/forms — form submission'ları listesi (filtre: contact/demo, export butonu)
- /admin/redirects — redirect yönetimi
- /admin/users — kullanıcı yönetimi (admin only)
- /admin/announcement — top bar yönetimi

Auth koruması:
- middleware.ts veya layout.tsx'de cookie'deki JWT'yi kontrol et
- Token yoksa /admin/login'e yönlendir

Admin layout: Sidebar navigasyon + Header (kullanıcı adı + çıkış)
Stil: Tailwind ile basit ve temiz, renk paletinden kron-blue kullan.
```

---

## ADIM 20 — Testler

```
### Backend Unit Testler (Jest)
Şu service'lerin unit testlerini yaz:

auth.service.spec.ts:
- validateUser: doğru şifre → user döndürür, yanlış şifre → null döndürür
- login: geçerli user → {accessToken, refreshToken} döndürür

products.service.spec.ts:
- findBySlug: mevcut slug → ürün döndürür, olmayan slug → NotFoundException fırlatır

forms.service.spec.ts:
- validateForm: demo formu için zorunlu alanlar eksikse → hata, hepsi doluysa → geçer

### Backend Integration Testler (Supertest)
auth.e2e-spec.ts:
- POST /auth/login — 200 + tokenlar (doğru bilgi), 401 (yanlış şifre)

products.e2e-spec.ts:
- GET /products/:slug — 200 (varsa), 404 (yoksa)
- POST /products — 401 (token yok), 403 (editor yetkisi yok ise ilgili endpoint), 201 (admin ise)
- DELETE /products/:id — 403 (editor), 200 (admin)

forms.e2e-spec.ts:
- POST /forms/submit — 400 (zorunlu alan eksik), 400 (reCAPTCHA geçersiz), 201 (başarılı)

submissions.e2e-spec.ts:
- GET /forms/contact/submissions — 401 (token yok), 403 (editor), 200 (admin)
- GET /forms/contact/submissions/export — 401, 403, 200 (admin, CSV döner)

Test framework: Jest, HTTP test: Supertest
Mock: reCAPTCHA doğrulamasını test ortamında mock'la
```

---

## ADIM 21 — README ve Son Düzeltmeler

```
README.md oluştur, şunları içersin:

# Krontech — Yeniden Geliştirme Projesi

## Hızlı Başlangıç
1. git clone [repo]
2. cd krontech
3. cp .env.example .env
4. docker compose up --build

## Servisler
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## Admin Panel
- URL: http://localhost:3000/admin
- Email: admin@krontech.com (seed'den)
- Şifre: .env'deki ADMIN_PASSWORD değeri

## Teknoloji Kararları
- NestJS seçildi: [gerekçe]
- REST seçildi: [gerekçe]
- JWT seçildi: [gerekçe]
- Jest seçildi: [gerekçe]

## Test Çalıştırma
cd backend
npm run test        # unit testler
npm run test:e2e    # integration testler

Son olarak şunları kontrol et:
- TypeScript hataları yok (tsc --noEmit)
- any kullanımı yok
- Tüm endpoint'ler Swagger'da görünüyor
- docker compose up --build ile her şey ayağa kalkıyor
- Admin login çalışıyor
- Bir ürün sayfası ISR ile render ediliyor
- Contact formu submit çalışıyor
- Sitemap.xml erişilebilir
- robots.txt doğru
```

---

## ÖNEMLI NOTLAR

1. **Her adımdan sonra test et.** Çalışmayan kodu bir sonraki adıma taşıma.
2. **any kullanma.** TypeScript strict mode.
3. **Cursor'a her seferinde tek adım ver.** Hepsini birden verme.
4. **PLAN.md dosyasını her zaman Cursor'ın context'ine ekle** (@ ile referans ver).
5. **Prisma schema'yı değiştirince** `npx prisma migrate dev` çalıştır.
6. **Yeni endpoint ekleyince** Swagger'da göründüğünü kontrol et.
