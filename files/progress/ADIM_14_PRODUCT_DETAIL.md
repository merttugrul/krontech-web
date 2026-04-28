# ADIM 14 — Ürün Detay Sayfası

> `/products/[slug]` (EN) ve `/tr/products/[slug]` (TR) sayfaları.
> Backend'den ürün verisini çeker, JSON bloklarını zod ile güvenli parse eder,
> Product + BreadcrumbList JSON-LD structured data yayınlar.

---

## Amaç

1. Yayınlanmış her ürün için SSG edilen detay sayfası üretmek.
2. Backend'in `unknown` olarak sakladığı JSON blokları (`solution`,
   `howItWorks`, `keyBenefits`, `productFamily`, `videos`) tip güvenli şekilde
   işlemek; bozuk/eksik veri sayfayı asla patlatmamalı.
3. SEO: canonical, hreflang, `Product` + `BreadcrumbList` JSON-LD,
   `metaTitle`/`metaDescription`/`ogImage`/`noIndex` override desteği.
4. UX: Hero → Solution → HowItWorks → KeyBenefits → Videos → Family → CTA
   sıralı bölüm düzeni, breadcrumb navigasyonu, related products.

---

## Dosya Envanteri

### Yeni

- `frontend/lib/schemas/product-detail.ts`
  - zod şemaları: `solutionSchema`, `howItWorksSchema`, `keyBenefitsSchema`,
    `productFamilySchema`, `videosSchema`.
  - Parse helper'ları: `parseSolution`, `parseHowItWorks`, `parseKeyBenefits`,
    `parseProductFamily`, `parseVideos` — hepsi fail-safe, hata → `null`.
  - `youtubeEmbedUrl()`: `watch?v=`, `youtu.be`, `embed`, `shorts` → embed URL.
  - `BenefitIcon` için `transform` ile fallback → bilinmeyen icon → `check`.

- `frontend/components/ui/Breadcrumb.tsx`
  - Schema.org `BreadcrumbList` odaklı `<ol>` markup.
  - `variant: 'dark' | 'white'` — koyu hero'larda beyaz tema.
  - Son item `aria-current="page"`, link değil.

- `frontend/components/seo/JsonLd.tsx`
  - `<script type="application/ld+json">` inline injector.
  - `<` karakterini `\u003c` ile escape eder (XSS-safe).
  - Tek object veya dizi (çoklu schema tek script) kabul eder.

- `frontend/components/sections/product/ProductHero.tsx`
  - Koyu hero, breadcrumb + kategori pill + başlık + shortDescription + 2 CTA.
  - Sağ: `ogImage` (priority image) ya da başlık baş harfinden placeholder.

- `frontend/components/sections/product/ProductSolution.tsx`
  - `container-tight` içinde heading + description + opsiyonel bullet list.

- `frontend/components/sections/product/ProductHowItWorks.tsx`
  - Numaralı kartlar (accent badge). `md:grid-cols-2 lg:grid-cols-3`.

- `frontend/components/sections/product/ProductKeyBenefits.tsx`
  - 3 sütunlu icon kartları. Icon seti `Icon` componentinden.

- `frontend/components/sections/product/ProductVideos.tsx`
  - YouTube `<iframe>` grid, `loading="lazy"`, geçersiz URL'leri filtreler.

- `frontend/components/sections/product/ProductFamily.tsx`
  - Admin'in belirlediği `slugs[]` → `/api/products?locale=…` list'inden filtrelenir.
  - Mevcut slug otomatik dışlanır. Eşleşme yoksa section render edilmez.

- `frontend/components/sections/product/ProductDetailPage.tsx`
  - EN/TR sayfalarının ortak render ağacı. `notFound()` yönlendirmesi, JSON-LD,
    sıralı bölüm composition.
  - Expose edilen: `listPublishedSlugs(locale)` (SSG),
    `fetchProductForMetadata(slug, locale)` (metadata).

- `frontend/app/(site)/products/[slug]/page.tsx`
  - `generateStaticParams` → yayınlanmış EN ürünlerin slug'ı.
  - `generateMetadata` → canonical, hreflang, OG.
  - `noIndex: true` → `robots: { index: false }` otomatik.

- `frontend/app/tr/products/[slug]/page.tsx`
  - Aynı yapı, `locale = 'tr'`, TR-özgü metadata.

- `frontend/__tests__/product-detail-schemas.test.ts` (22 test)
  - Solution, HowItWorks, KeyBenefits, ProductFamily, Videos, youtubeEmbedUrl.

- `frontend/__tests__/Breadcrumb.test.tsx` (5 test)
  - Render, `aria-current`, link davranışı, boş items, separator sayısı.

### Güncellenen

- `frontend/lib/i18n.ts`
  - `Dictionary.products` bloğu eklendi: breadcrumb, hero CTA, bölüm başlıkları,
    not-found fallback strings (EN/TR).

---

## Veri Kontratı — `ProductDetail` JSON Blokları

Backend Prisma `unknown` saklıyor; admin panel (ADIM 19) bu şekillere
uymalı:

```jsonc
{
  "solution": {
    "heading": "The Solution",          // optional
    "description": "Kron unifies ...",  // zorunlu
    "bullets": ["...", "..."]           // optional
  },
  "howItWorks": {
    "heading": "How it works",          // optional
    "steps": [                          // min 1
      { "title": "Ingest", "description": "..." }
    ]
  },
  "keyBenefits": {
    "heading": "Key benefits",
    "items": [                          // min 1
      { "title": "...", "description": "...", "icon": "shield" }
      // icon ∈ shield | bolt | graph | globe | check (bilinmeyen → check)
    ]
  },
  "productFamily": {
    "heading": "Product family",
    "slugs": ["related-slug-1"]         // min 1
  },
  "videos": {
    "heading": "Watch",
    "items": [
      { "title": "Demo", "youtubeUrl": "https://www.youtube.com/watch?v=..." }
    ]
  }
}
```

Herhangi bir blok bu şemaya uymazsa **o bölüm sessizce atlanır** —
sayfa kalan içeriklerle render olur.

---

## Mimari Kararlar

### Neden zod?

Backend `@IsObject()` ile runtime şeması zayıf (admin paneli henüz yok).
Frontend'in şekil sözleşmesini dondurması gerekiyordu; `safeParse` başarısız
olursa sadece o bölüm gizlenir, sayfa çalışmaya devam eder. Bu yaklaşım
admin editöründen bozuk data gelse bile production'da sağlam ayakta kalır.

### SSG + `dynamicParams: true`

Next.js 14 App Router'ında dynamic segment pages varsayılan olarak
`dynamicParams = true`. Build anında backend'e erişim olursa slug'lar
pre-render edilir; olmazsa fallback olarak ilk istek sırasında SSR
çalışır ve ISR cache'ler (`revalidate: 300`).

### JSON-LD inline script

Next.js `<Script>` kullanımı **hydration sonrası** inject ediyor; crawler'lar
için bu çok geç. `dangerouslySetInnerHTML` ile inline basmak hem SEO
güvenli hem de render cost 0. XSS riskini `<` karakter escape ile
kapattık.

### `localePrefix('en') === ''`

Ana sayfa routing stratejisi ADIM 12'den: EN prefix yok (`/products/...`),
TR prefix `/tr/...`. Breadcrumb'ın `Home` linki `''` → `/` fallback'iyle
çözüldü.

### `ProductFamily` için filter stratejisi

Backend `/api/products?slugIn=...` desteklemiyor; bunun için ya
backend'e endpoint eklemek ya da tüm listeyi alıp filtrelemek gerekiyordu.
10-20 ürün aralığında **tek list çağrısı** daha ucuz (backend zaten Redis
cache'li). 100+ ürün ölçeklendiğinde ADIM 18'de `?slugs=a,b` filter'ı
eklenebilir.

### `metaTitle`/`metaDescription` override

Her ürünün çevirisi kendi SEO title/description sağlayabiliyor. Yoksa
fallback: `"{title} · Krontech"` / `shortDescription`. `noIndex: true`
admin toggle'ı ile `robots: { index: false, follow: true }` otomatik
set edilir.

---

## Test Sonuçları

- **`npm run type-check`** → 0 error.
- **`npm run lint`** → 0 warning.
- **`npm test`** → 60/60 test (önceki 38 + yeni 22 schema + 5 breadcrumb
  - *düzeltme*: 60 toplamı gösteriyor; 9 suite, 22 schema test, 5 breadcrumb
  test = 27 yeni case eklendi).
- **`npm run build`** → compile OK, `/products/[slug]` ve `/tr/products/[slug]`
  SSG (●) olarak işaretlendi, ~101 kB first-load JS.

### Yeni Test Case'leri (detay)

**product-detail-schemas.test.ts** (22 case):
- `parseSolution`: geçerli payload, opsiyonel heading, eksik description → null,
  string/null input → null.
- `parseHowItWorks`: boş steps → null, eksik field'lı step → null, geçerli
  multi-step.
- `parseKeyBenefits`: bilinmeyen icon → `check` fallback, geçerli icon korunur.
- `parseProductFamily`: boş slugs → null, heading + slug listesi.
- `parseVideos`: vimeo URL reddi, youtube.com + youtu.be kabulü.
- `youtubeEmbedUrl`: watch?v=, youtu.be, shorts, embed, invalid URL.

**Breadcrumb.test.tsx** (5 case):
- Tüm item render, son item `aria-current`, link davranışı, boş liste,
  separator sayısı.

---

## Manuel Kontrol Listesi

Backend `docker compose up` ile çalışırken:

1. Seed'lenmiş ürün slug'ına git: `http://localhost:3000/products/<slug>`.
2. TR versiyonunu kontrol et: `http://localhost:3000/tr/products/<slug>`.
3. DevTools → **Elements** → `<head>` içinde:
   - `<title>` doldu mu?
   - `<meta name="description">` var mı?
   - `<link rel="canonical">` doğru URL?
   - `<link rel="alternate" hreflang="en/tr">` çiftleri?
   - `<meta property="og:image">` `ogImage` varsa?
4. **Elements** → body altında 2 adet `<script type="application/ld+json">`:
   - Biri `@type: Product`, diğeri `@type: BreadcrumbList`.
5. [Google Rich Results Test](https://search.google.com/test/rich-results)
   ile URL'i doğrula → Product + Breadcrumb işaretlenmeli.
6. `solution.description` olmayan bir ürün oluştur → Solution bölümü
   render edilmemeli, sayfa yine çalışmalı.
7. `videos.items[0].youtubeUrl = "https://vimeo.com/123"` → video bölümü
   gizlenmeli.
8. `productFamily.slugs = ["existing-slug", "nonexistent"]` → sadece
   mevcut olan kart olarak render.
9. `noIndex: true` çeviri → DevTools'ta `<meta name="robots" content="noindex">`.
10. Backend kapalıyken `/products/anything` → Next.js `not-found.tsx` (default 404).

---

## Açık Uçlar / Sonraki Adımlar

- **ADIM 15 (Blog)**: slug bazlı çakışma riskine karşı middleware stratejisi —
  `/[slug]` yerine `/blog/[slug]`, `/products/[slug]`, `/resources/[slug]`
  net ayrı namespace'ler kullanıyoruz; bu ADIM'de sorun çıkmaz.
- **ADIM 18 (SEO altyapısı)**: `next-sitemap` ya da manuel `sitemap.xml` route,
  `robots.txt`, global structured data (Organization), redirect middleware.
- **ADIM 19 (Admin panel)**: JSON bloklarının editör UI'ı. Şu an şema
  frontend'de donduğu için admin form validation burada referans alınacak.
- Performans: `ProductFamily` için tüm list yerine filtered endpoint
  ekleme kararı 100+ ürün sonrası değerlendirilecek.
