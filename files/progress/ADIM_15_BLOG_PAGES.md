# ADIM 15 — Blog & News Sayfaları

> `/blog`, `/news`, `/blog/[slug]`, `/news/[slug]` (EN + TR) — toplam 8 route.
> HTML içerik `sanitize-html` ile XSS-temizleniyor, Tailwind Typography ile
> rende olunuyor. `Article`/`NewsArticle` + `BreadcrumbList` + opsiyonel
> `FAQPage` JSON-LD yayımlanıyor.

---

## Amaç

1. Blog ve News listeleme sayfaları (paginated, highlight filter).
2. Blog ve News detay sayfaları (SSG + ISR, on-demand revalidate).
3. Stored-XSS'e karşı sanitizasyon katmanı + Tailwind `prose` stili.
4. FAQ accordion + `FAQPage` structured data.
5. Related posts (aynı type, current slug hariç, 3 adet).
6. Reading-time hesabı (HTML → kelime sayımı → 225 wpm).
7. Backend kapalıysa her sayfa **fail-safe** render (empty state / notFound).

---

## Dosya Envanteri

### Yeni Paketler

- `sanitize-html@^2.13` + `@types/sanitize-html@^2.13` — stored XSS koruması.
- `@tailwindcss/typography@^0.5.15` — `prose` utility sınıfları.

### Yeni Dosyalar

- `frontend/lib/sanitize.ts`
  - `sanitizeContent(html)` — TipTap output için whitelist-based sanitize.
    - Tags: heading/inline/list/table/link/img/figure + iframe.
    - `allowedIframeHostnames`: `www.youtube.com`, `youtube.com`, `player.vimeo.com`.
    - `<a>`: otomatik `target="_blank" rel="noopener noreferrer nofollow"`.
    - `javascript:` / `data:` protokolü reddedilir (img hariç `data:` izinli).
  - `extractHeadings(html)` — h2/h3 başlıkları + uniq id'ler (TOC için rezerv).

- `frontend/components/ui/Pagination.tsx`
  - Link-based pagination (SSG friendly).
  - `computeVisiblePages(current, total)` — `[1, '…', 9, 10, 11, '…', 20]`
    döner, max 7 item.
  - Prev/next disabled ilk/son sayfada, `rel="prev|next"` SEO hint.
  - `extraQuery` param ile `?highlight=1` gibi filtreler korunur.

- `frontend/components/sections/blog/BlogArticle.tsx`
  - `prose prose-slate prose-lg` + Krontech override (`prose-a:text-kron-accent`).
  - `dangerouslySetInnerHTML` + `sanitizeContent` ikilisi.

- `frontend/components/sections/blog/BlogFaq.tsx`
  - `<details>/<summary>` vanilla accordion (JS gerektirmez).
  - `FAQPage` JSON-LD inline.

- `frontend/components/sections/blog/RelatedPosts.tsx`
  - `/blog?locale=…&type=…&page=1&pageSize=4` — current slug filtrelenir, 3'ü
    gösterilir.
  - Fail-safe: backend kapalıysa section gizlenir.

- `frontend/components/sections/blog/BlogListingPage.tsx`
  - Hero + breadcrumb + filter rozeti (All / Highlights).
  - 12'li grid + `Pagination`.
  - Empty state rendering (dashed border card).
  - `fetchList` fail-safe: backend kapalı → empty `Paginated`.

- `frontend/components/sections/blog/BlogDetailPage.tsx`
  - Ortak composer: hero → cover image → article → FAQ → related.
  - `expectedType` mismatch → `notFound()` (URL `/news/foo` ama post `type=blog`).
  - `Article`/`NewsArticle` + `BreadcrumbList` JSON-LD.
  - `listPublishedBlogSlugs`, `fetchPostForMetadata` helper exports.

- **Page routes (8 adet):**
  - `app/(site)/blog/page.tsx`, `app/tr/blog/page.tsx`
  - `app/(site)/news/page.tsx`, `app/tr/news/page.tsx`
  - `app/(site)/blog/[slug]/page.tsx`, `app/tr/blog/[slug]/page.tsx`
  - `app/(site)/news/[slug]/page.tsx`, `app/tr/news/[slug]/page.tsx`

- **Yeni testler:**
  - `__tests__/sanitize.test.ts` (13 case) — script/onclick/javascript/iframe
    host whitelist/formatting/table/heading extraction + duplicate id'ler.
  - `__tests__/Pagination.test.tsx` (10 case) — visible pages algoritması,
    href inşası, `aria-current`, `extraQuery`.
  - `__tests__/readingTime.test.ts` (5 case) — boş/kısa/uzun içerik,
    HTML tag stripping.

### Güncellenen

- `frontend/tailwind.config.ts`
  - `plugins: [typography]` (import ile).
- `frontend/lib/i18n.ts`
  - `Dictionary.blog` bloğu (EN + TR) — breadcrumb, filter, empty, pagination,
    FAQ, reading-time birimi, author prefix.
- `frontend/lib/utils.ts`
  - `readingTimeMinutes(html)` eklendi (225 wpm default).

---

## Routing Kararları

### Neden `/blog` ve `/news` ayrı namespace?

Backend `BlogPost.type ∈ { blog, news }` tek tabloda saklıyor ancak URL
tarafında ayrık namespace kullandık:

- SEO: `NewsArticle` schema `Article`tan daha katı (datePublished zorunlu,
  haber aggregatorlar için farklı crawl priority). Schema.org'a doğru sinyali
  vermek için ayrı path tercih edildi.
- Nav: `Dictionary.nav` zaten `blog` ve `news` için ayrı link tutuyor (ADIM 12).
- Slug çakışması: Aynı slug hem blog hem news olarak kullanılmasın diye
  backend tek `BlogPost.slug` unique constraint'i ile korur. Detay sayfası
  `expectedType` mismatch'ını `notFound()` ile keser — yanlış kategori
  altındaki bir slug 404 döner.

### Listing dinamik neden?

`/blog` ve `/news` `searchParams` aldığı için (`?page=`, `?highlight=`) Next.js
bunları `ƒ (Dynamic)` olarak işaretledi — SSR. `fetch` Next cache layer'ı ile
`revalidate: 300` + tag `blog` → cache hit performansı SSR'a yakın.

Detay sayfalarında (`[slug]`) searchParams yok → SSG. Build zamanı `generateStaticParams`
ile yayınlanmış slug'lar prerender edilir. Yeni slug on-demand fallback.

### Tailwind Typography stili

Plugin geldi, `prose prose-slate prose-lg` temel set. Krontech tonlarına
şu 5 override geçildi:
```
prose-headings:text-kron-dark      → başlıklar koyu
prose-a:text-kron-accent           → linkler mavi
prose-a:no-underline hover:…       → default hover efekti
prose-strong:text-kron-dark        → kalın yazılar
prose-blockquote:border-kron-accent → alıntı kenarlığı
prose-code:…                       → inline code stili
```

### sanitize-html whitelist

TipTap admin çıktısı büyük ihtimalle temiz ama editor'ün `html:true` extension'ı
ile JavaScript URL'ler injekte edilebilir. Whitelist:

- Allowed tags: heading/inline/list/table/link/img/figure + iframe (YouTube/Vimeo).
- Allowed attributes: `href, target, rel`, `src, alt, title, width, height, loading`,
  `class` (global — Tailwind için).
- Allowed schemes: `http, https, mailto` (img'da `data:` ekstra).
- Iframe host whitelist: YouTube + Vimeo player.
- `<a>` transform: `target=_blank`, `rel=noopener noreferrer nofollow`.

### Reading time

`readingTimeMinutes` HTML tag'larını soyar, boşluk-split ile kelime sayar,
`Math.max(1, Math.round(words / 225))` döner. Resim/video padding'i eklemiyoruz
— underestimate daha dürüst.

---

## SEO & Structured Data

### Per-post meta (BlogDetailPage)

- `title`: `metaTitle` ?? `"{title} · Krontech"`
- `description`: `metaDescription` ?? `excerpt`
- `canonical`: `canonicalUrl` ?? `/{locale?}/(blog|news)/{slug}`
- `alternates.languages`: `{ en, tr }` hreflang pair
- `openGraph.type`: `article`, `publishedTime` ekli
- `robots.index: false` → `noIndex: true` çeviri flag'i set edilmişse

### JSON-LD

Her detay sayfası 2-3 schema yayınlar:

1. **Article** (blog) veya **NewsArticle** (news) — headline, image, author,
   publisher, dates, mainEntityOfPage.
2. **BreadcrumbList** — Home → Blog/News → Post title (3 seviye).
3. **FAQPage** (opsiyonel) — `faqItems` varsa. `Question` + `Answer` array.

Tümü `JsonLd` component'i ile `<` escape edilmiş inline script olarak basılır.

---

## Test Sonuçları

- **`npm run type-check`** → 0 error.
- **`npm run lint`** → 0 warning.
- **`npm test`** → 12 suite / **87 test** passed (önceki 60 + 27 yeni).
- **`npm run build`** →
  ```
  /blog                  ƒ Dynamic
  /tr/blog               ƒ Dynamic
  /news                  ƒ Dynamic
  /tr/news               ƒ Dynamic
  /blog/[slug]           ● SSG
  /tr/blog/[slug]        ● SSG
  /news/[slug]           ● SSG
  /tr/news/[slug]        ● SSG
  ```

### Yeni Test Özeti (28 case)

- **sanitize** (13): script silme, onclick/javascript reject, target=_blank
  injection, YouTube iframe allow, external iframe strip, formatting/table
  preserve, heading extraction + duplicate id uniqueness.
- **Pagination** (10): visible pages algoritması (≤7, ortada, başta, sonda),
  aria-current, href query inşası, extraQuery persist.
- **readingTime** (5): boş string, HTML tag stripping, 225/450/900 kelime.

---

## Manuel Kontrol Listesi

Backend çalışır durumda (`docker compose up`):

1. **Listing sayfaları**
   - `http://localhost:3000/blog` → 12'li grid, paginate çalışıyor.
   - `http://localhost:3000/blog?highlight=1` → sadece `isHighlight: true`.
   - `http://localhost:3000/blog?page=2` → 2. sayfa, pagination doğru.
   - `http://localhost:3000/tr/blog` → TR içerik.
   - Aynı akışı `/news` ile tekrarla.
2. **Detay sayfası**
   - Seed'li blog slug'ına git: `/blog/<slug>`.
   - DevTools → Elements → `<head>`:
     - `<title>` post.metaTitle veya `"{title} · Krontech"`.
     - `<meta name="description">`, `<link rel="canonical">`, hreflang pair.
     - `<meta property="og:type" content="article">`.
   - `<body>` → 2-3 adet `<script type="application/ld+json">`:
     - `Article` / `NewsArticle`, `BreadcrumbList`, (varsa) `FAQPage`.
   - [Rich Results Test](https://search.google.com/test/rich-results) → PASS.
3. **XSS kontrolü**
   - Admin panel (ADIM 19) öncesinde manuel olarak Prisma Studio'dan bir blog
     `content` alanına `<script>alert(1)</script>` koy → sayfa açılınca
     **alert çıkmamalı**.
   - `<a href="javascript:alert(1)">` → link sanitize'da `javascript:` silinmeli.
   - `<iframe src="https://evil.com">` → iframe render edilmemeli.
4. **Type mismatch 404**
   - Bir blog yazısının slug'ını `/news/<slug>` olarak ziyaret et → 404.
5. **Related posts**
   - Detay sayfasının altında **aynı type'tan** 3 farklı post görünmeli.
   - Tek post varsa section gizlenir.
6. **FAQ**
   - `faqItems` dolu bir post → FAQ bölümü accordion olarak açılıp kapanıyor.
   - `FAQPage` JSON-LD `mainEntity` array'inde tüm sorular var.
7. **Reading time**
   - Uzun içerikli post → hero altında `"~X dk okuma"` etiketi doğru.
8. **Backend kapalıyken**
   - Docker'ı durdur, `/blog` → empty state rendering.
   - `/blog/<slug>` → Next.js `not-found.tsx` (404).
9. **Sanitizasyon yan etkisi**
   - Blog içindeki **dış link'ler** yeni sekmede açılıyor mu? (`target=_blank`).
   - YouTube embed `<iframe>`i görünüyor mu?

---

## Açık Uçlar / Sonraki Adımlar

- **ADIM 17 (Contact)**: Form entegrasyonu, reCAPTCHA v3 skor kontrolü.
- **ADIM 18 (SEO altyapısı)**:
  - `app/sitemap.ts` (Next native) — backend `/sitemap.xml`'i frontend'den
    yönlendirerek kullan, ya da kendi sitemap'ini oluştur.
  - `robots.txt` route.
  - `Organization` structured data site geneli.
  - **Redirect middleware** (backend `/api/redirects/lookup` ile): ADIM 8'de
    hazır API — middleware içinden çağırıp 301/302 döndüreceğiz.
- **ADIM 19 (Admin panel)**: TipTap + FAQ CRUD + metaTitle/ogImage editör UI.
- Reading time şu an her render'da hesaplanıyor; yüksek trafikte memoize
  edilebilir veya backend'de `readingTime` alanı olarak saklanabilir.
- `sanitize-html`'in Node-only olduğu göz önünde bulunduruldu — sadece RSC'de
  kullanıyoruz, client-side import yok.
