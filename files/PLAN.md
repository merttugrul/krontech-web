# Krontech.com — Yeniden Geliştirme Projesi

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript — `any` kullanma!
- **Backend:** NestJS + TypeScript
- **DB:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Medya:** MinIO (S3 uyumlu)
- **Auth:** JWT (Access 15dk + Refresh 7gün)
- **API:** REST + Swagger/OpenAPI
- **Test:** Jest + Supertest
- **Container:** Docker + Docker Compose

---

## Klasör Yapısı

```
krontech/
├── frontend/          # Next.js projesi
├── backend/           # NestJS projesi
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## URL Yapısı (Mevcut Site URL'leri Korunuyor)

| Sayfa | EN URL | TR URL | Next.js Dosyası |
|---|---|---|---|
| Ana Sayfa | `/` | `/tr` | `app/page.tsx` |
| Ürün Detay | `/[productSlug]` | `/[productSlug]` (aynı!) | `app/[productSlug]/page.tsx` |
| Blog Liste | `/blog` | `/tr/blog` | `app/blog/page.tsx` |
| Blog Detay | `/[slug]` | `/tr/[slug]` | `app/[slug]/page.tsx` |
| Kaynaklar Hub | `/cybersecurity-resources` | `/tr/cybersecurity-resources` | `app/cybersecurity-resources/page.tsx` |
| Datasheet'ler | `/kron-pam-resources` | `/tr/kron-pam-resources` | `app/kron-pam-resources/page.tsx` |
| Case Studies | `/case-studies` | `/tr/case-studies` | `app/case-studies/page.tsx` |
| İletişim | `/contact` | `/tr/iletisim` | `app/contact/page.tsx` |
| Admin | `/admin` | yok | `app/admin/...` |

### Önemli: Çok Dil Kuralları
- Varsayılan dil: EN (prefix yok)
- Türkçe: `/tr/` prefix
- Ürün sayfaları: TR'de de prefix yok, içerik locale'e göre değişiyor
- hreflang: generateMetadata içinde her sayfada otomatik eklenmeli

---

## Sayfalar ve Bileşenler

### Ana Sayfa (/)
Bölümler sırasıyla:
1. `AnnouncementBar` — top banner, admin'den yönetilir
2. `Navbar` — mega menü, dil switcher (EN/TR menü yapısı farklı!)
3. `HeroSlider` — dönen ürün tanıtımları carousel
4. `ProductsSection` — 8 ürün kartı carousel
5. `WhyKron` — metin + analist rozetleri (Gartner, Forrester, KuppingerCole)
6. `StatsSection` — 6 Continents, 35+ Countries, 200+ Partners, 1500+ Deployments
7. `CaseStudyHighlight` — öne çıkan müşteri hikayesi
8. `BlogFeed` — son blog + haber kartları carousel
9. `ContactBanner` — her sayfada tekrarlayan form bandı
10. `Footer` — 4 kolon: Products, Sectors, About Us, Social Media

### Ürün Detay (/[productSlug])
1. `AnnouncementBar`
2. `Navbar`
3. `ProductHero` — başlık, açıklama, "Download Datasheet" + "Request a Demo" butonları
4. `ProductTabMenu` — 6 tab sticky: Solution | How It Works | Key Benefits | Product Family | Resources | Videos
5. `Breadcrumb` — Home > Kategori > Ürün adı
6. `FeatureSections` — alternatif sol/sağ görsel+metin blokları
7. `TestimonialCarousel` — müşteri alıntıları
8. `CaseStudyBlock` — video thumbnail + müşteri açıklaması
9. `ContactBanner`
10. `Footer`

### Blog Liste (/blog)
1. Kısa hero banner — sadece "Blog" başlığı
2. Breadcrumb — Home > Blog
3. Sol: büyük blog kartları dikey liste + sayfalama (5 yazı/sayfa)
4. Sağ sidebar: "Highlights" — öne çıkan 8 yazı listesi
5. `ContactBanner`
6. `Footer`

### Blog Detay (/[slug])
1. Tam genişlik kapak görseli
2. Başlık + tarih + yazar + sosyal paylaşım ikonları (LinkedIn, Facebook, Twitter)
3. Rich text içerik (H2/H3 başlıklar)
4. `FAQAccordion` — sayfanın altında, FAQPage schema.org ile (GEO için kritik!)
5. Sağ sidebar: aynı Highlights listesi
6. `ContactBanner`
7. `Footer`

### Kaynaklar Hub (/cybersecurity-resources)
1. Kısa hero banner
2. Breadcrumb
3. 3'lü kart grid: Case Studies | Resources | Blog — her biri "Discover More" butonlu
4. `ContactBanner`
5. `Footer`

### Datasheet'ler (/kron-pam-resources)
NOT: Bu sayfa Kron PAM ürün sayfasının Resources tabı — aynı URL hem tab hem standalone çalışıyor
1. `ProductHero` (Kron PAM için)
2. `ProductTabMenu` (Resources tab aktif)
3. Intro: başlık + açıklama + sağda görsel
4. 3'lü PDF grid — her kart: ürün adı, kapak görseli, Download butonu
5. `ContactBanner`
6. `Footer`

### Contact (/contact)
1. Kısa hero banner
2. Breadcrumb — Home > Contact
3. Ana contact formu (detay aşağıda)
4. Ofis bilgileri — İstanbul HQ, USA, Ankara, İzmir (alternatif sol/sağ layout)
5. `ContactBanner`
6. `Footer`

---

## Form Alanları

### Demo/Short Form (her sayfadaki ContactBanner'da)
- First Name, Last Name
- Company
- E-Mail
- Country (bayraklı dropdown)
- Phone
- KVKK Checkbox 1 (kişisel veri transferi)
- KVKK Checkbox 2 (ticari elektronik ileti)
- reCAPTCHA v2
- Send butonu

### Contact Formu (/contact sayfasında)
- First Name *, Last Name *
- E-Mail *, Job Title *
- Department * (dropdown), Company *
- Country (bayraklı dropdown), Phone
- "Do you need a call for assistance?" (dropdown)
- Subject *
- Message * (textarea)
- KVKK Checkbox 1
- KVKK Checkbox 2
- reCAPTCHA v2
- Send butonu

---

## Component Listesi ve Props

```typescript
// AnnouncementBar
interface AnnouncementBarProps {
  text: string
  linkUrl: string
  linkLabel: string
}

// HeroSlider
interface HeroSlide {
  title: string
  highlightedWord: string // mavi highlight olan kelime
  description: string
  ctaText: string
  ctaUrl: string
  image: string
}

// ProductCard
interface ProductCardProps {
  title: string
  icon: string
  bullets: string[]
  ctaUrl: string
}

// ProductHero
interface ProductHeroProps {
  title: string
  description: string
  datasheetUrl?: string
  demoUrl?: string
  bgImage: string
}

// ProductTabMenu
type TabType = 'solution' | 'howItWorks' | 'keyBenefits' | 'productFamily' | 'resources' | 'videos'
interface ProductTabMenuProps {
  activeTab: TabType
  productSlug: string
}

// FeatureSection
interface FeatureSectionProps {
  title: string
  highlightedWord: string
  description: string
  image: string
  imagePosition: 'left' | 'right'
}

// TestimonialCarousel
interface Testimonial {
  companyLogo: string
  companyName: string
  quote: string
  personName: string
  personTitle: string
}

// BlogCard
interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  type: 'blog' | 'news'
  coverImage: string
  slug: string
}

// FAQAccordion
interface FAQItem {
  question: string
  answer: string
}

// ResourceCard
interface ResourceCardProps {
  title: string
  coverImage: string
  downloadUrl: string
  type: 'datasheet' | 'casestudy' | 'whitepaper'
}

// OfficeCard
interface OfficeCardProps {
  city: string
  email: string
  phone: string
  fax?: string
  address: string
  image: string
  imagePosition: 'left' | 'right'
}

// Breadcrumb
interface BreadcrumbItem {
  label: string
  href?: string
}
```

---

## İçerik Modeli (Prisma Schema — tam dosyası ayrıca var)

### Ana Entity'ler
- `Product` + `ProductTranslation` — ürünler (slug, status, locale bazlı içerik)
- `BlogPost` + `BlogPostTranslation` — blog ve haberler (type: blog|news)
- `Resource` — datasheet, case study, whitepaper (PDF dosyaları)
- `Testimonial` — müşteri alıntıları (ürün sayfasında)
- `Office` — ofis bilgileri (contact sayfasında)
- `AnnouncementBar` — top banner
- `Form` + `FormSubmission` — form tanımı ve gelen veriler
- `Media` — S3 medya dosyaları
- `User` — admin/editor kullanıcıları
- `Redirect` — 301/302 yönlendirmeler
- `AuditLog` — değişiklik geçmişi
- `ContentVersion` — versiyonlama

---

## Backend API Endpoint'leri

### Auth
- `POST /auth/login` — Public
- `POST /auth/refresh` — Public
- `GET /auth/me` — JWT korumalı

### Products
- `GET /products` — Public (locale, status filtresi)
- `GET /products/:slug` — Public
- `POST /products` — Admin/Editor
- `PUT /products/:id` — Admin/Editor
- `DELETE /products/:id` — Admin only
- `POST /products/:id/publish` — Admin/Editor
- `POST /products/:id/schedule` — Admin/Editor

### Blog
- `GET /blog` — Public (locale, type, page filtresi)
- `GET /blog/:slug` — Public
- `POST /blog` — Admin/Editor
- `PUT /blog/:id` — Admin/Editor
- `DELETE /blog/:id` — Admin only
- `POST /blog/:id/publish` — Admin/Editor

### Resources
- `GET /resources` — Public (type, locale filtresi)
- `POST /resources` — Admin/Editor
- `PUT /resources/:id` — Admin/Editor
- `DELETE /resources/:id` — Admin only

### Media
- `POST /media/upload` — Admin/Editor
- `GET /media` — Admin/Editor
- `DELETE /media/:id` — Admin only

### Forms
- `POST /forms/submit` — Public (reCAPTCHA doğrulamalı)
- `GET /forms/:type/submissions` — Admin only
- `GET /forms/:type/submissions/export` — Admin only (CSV)

### SEO/System
- `GET /sitemap` — Public (XML döner)
- `GET /redirects` — Admin
- `POST/PUT/DELETE /redirects` — Admin
- `POST /revalidate` — Secret key (Next.js ISR webhook)
- `GET /announcement` — Public (aktif bar)

### Admin/Users
- `GET /users` — Admin only
- `POST /users` — Admin only
- `PUT /users/:id` — Admin only
- `DELETE /users/:id` — Admin only
- `GET /audit-logs` — Admin only

---

## Yetki Matrisi

| Yetki | Admin | Editor |
|---|---|---|
| İçerik oluşturma/düzenleme | Evet | Evet |
| Draft kaydetme | Evet | Evet |
| İçerik yayınlama | Evet | Evet |
| İçerik silme | Evet | Hayır |
| Kullanıcı yönetimi | Evet | Hayır |
| Form verilerini görüntüleme | Evet | Hayır |
| Form verilerini export etme | Evet | Hayır |
| Redirect yönetimi | Evet | Hayır |
| Site ayarları | Evet | Hayır |
| Audit log görüntüleme | Evet | Hayır |

---

## SEO Gereksinimleri (Her Sayfa)

```typescript
// generateMetadata örneği
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug, params.locale)
  return {
    title: product.metaTitle,
    description: product.metaDescription,
    robots: product.noIndex ? 'noindex' : 'index, follow',
    alternates: {
      canonical: product.canonicalUrl,
      languages: {
        'en': `https://krontech.com/${product.slug}`,
        'tr': `https://krontech.com/${product.slug}`, // ürünler için aynı
      }
    },
    openGraph: {
      title: product.metaTitle,
      description: product.metaDescription,
      images: [product.ogImage],
    }
  }
}
```

## GEO Gereksinimleri (Structured Data)

```typescript
// Her sayfada <script type="application/ld+json"> olacak
// Ürün sayfası:
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.title,
  "description": product.shortDescription,
}

// Blog detay:
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "datePublished": post.publishedAt,
}

// Blog detay FAQ bölümü:
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": post.faqItems.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": { "@type": "Answer", "text": item.answer }
  }))
}
```

---

## Cache Stratejisi

| Sayfa | Strateji | revalidate |
|---|---|---|
| Ana Sayfa | ISR | 3600sn |
| Ürün Detay | ISR | 1800sn |
| Blog Liste | ISR | 600sn |
| Blog Detay | ISR | 3600sn |
| Kaynaklar | ISR | 3600sn |
| Contact | Static | false |
| Admin Panel | CSR | — |

### Cache Invalidation Akışı
1. Admin publish eder
2. NestJS DB'yi günceller
3. Redis cache temizlenir
4. NestJS → Next.js `/api/revalidate` webhook gönderir
5. Next.js `revalidatePath()` çalışır
6. Bir sonraki request'te sayfa yeniden oluşturulur

---

## Yayın Süreçleri

- **Draft** → kaydedildi, yayınlanmadı
- **Published** → canlıda
- **Scheduled** → publishedAt gelecek tarih, cron job otomatik yayınlar
- **Preview link** → `/api/preview?token=SECRET&slug=xxx`
- **Versiyonlama** → her publish'de ContentVersion tablosuna kayıt
- **Audit log** → her CRUD işleminde AuditLog tablosuna kayıt

---

## Test Stratejisi

### Unit Test (Jest)
- Tüm service metodları
- Utility fonksiyonlar
- Validation pipe'ları

### Integration Test (Jest + Supertest)
Mutlaka test edilecekler:
- `POST /auth/login` — başarılı, yanlış şifre, olmayan kullanıcı
- `POST /forms/submit` — başarılı, validasyon hatası, reCAPTCHA hatası
- `GET /products/:slug` — bulunan, bulunamayan
- `POST /products/:id/publish` — admin yetkisi, editor yetkisi, yetkisiz
- `GET /forms/submissions/export` — admin geçer, editor reddedilir

---

## Docker Compose Servisleri

| Servis | Image | Port |
|---|---|---|
| postgres | postgres:16 | 5432 |
| redis | redis:7-alpine | 6379 |
| minio | minio/minio | 9000/9001 |
| backend | custom (node:20) | 4000 |
| frontend | custom (node:20) | 3000 |

Tek komut: `docker compose up --build`

---

## Environment Variables (.env.example)

```env
# Database
DATABASE_URL=postgresql://krontech:password@postgres:5432/krontech

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=supersecretjwtkey
JWT_REFRESH_SECRET=supersecretrefreshkey
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_BUCKET=krontech-media
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# reCAPTCHA
RECAPTCHA_SECRET=your_recaptcha_secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:4000
REVALIDATION_SECRET=revalidationsecret

# Admin Seed
ADMIN_EMAIL=admin@krontech.com
ADMIN_PASSWORD=Admin123!
```
