# ADIM 13 — Ana sayfa (Hero + Ürünler + Değer önerileri + Blog + CTA)

**Durum:** ✅ Tamamlandı
**Tarih:** 2026-04-20
**Önceki adım:** ADIM 12 (Layout componentleri)
**Sonraki adım:** ADIM 14 (Ürün detay sayfası)

## Amaç

Ana sayfa marketing deneyimini 5 bölümden oluşan RSC-tabanlı bir akışla kurmak:

1. **HeroSection** — büyük başlık, eyebrow, iki CTA, koyu gradient
2. **ProductShowcase** — backend'den çekilen ilk 6 ürünün grid kartları
3. **ValueProps** — 4 ikonlu statik değer önerisi bloğu
4. **LatestBlog** — backend'den çekilen son 3 blog yazısı
5. **CtaSection** — koyu zeminli kapanış çağrısı

Tüm sections server component; backend'e giden veri `sfetch` ile çekiliyor
ve Next.js cache tag'leri (`products`, `blog`) üzerinden backend'in
revalidate sinyalleriyle senkron (ADIM 9 altyapısı).

## Oluşturulan / güncellenen dosyalar

| Dosya | Tür | Özet |
|---|---|---|
| `frontend/lib/i18n.ts` | Güncellendi | `Dictionary.home` (hero, ürün, value props, blog, CTA) + `common.readMore/learnMore/viewAll`. EN + TR. |
| `frontend/components/ui/Icon.tsx` | Yeni | 6 ikon (`shield`, `bolt`, `graph`, `globe`, `arrow-right`, `check`) inline SVG. Heroicons/Lucide paket ücreti olmadan. |
| `frontend/components/ui/ProductCard.tsx` | Yeni | Ürün kartı — cover image fallback, category badge, truncate excerpt, arrow CTA. |
| `frontend/components/ui/BlogCard.tsx` | Yeni | Blog kartı — type pill (blog/news), `<time datetime>`, excerpt, arrow CTA. |
| `frontend/components/sections/HeroSection.tsx` | Yeni | Gradient hero, radial accent glow, Highlight'lı başlık, iki CTA. |
| `frontend/components/sections/ProductShowcase.tsx` | Yeni | `sfetch('/products')` + fail-safe fallback + empty state. 6 kartlı grid. |
| `frontend/components/sections/ValueProps.tsx` | Yeni | 4 kartlı statik grid — veri dictionary'den. |
| `frontend/components/sections/LatestBlog.tsx` | Yeni | `sfetch('/blog?pageSize=3')` + fail-safe + empty state. 3 kartlı grid. |
| `frontend/components/sections/CtaSection.tsx` | Yeni | Koyu zemin kapanış bölümü, çift CTA. |
| `frontend/app/(site)/page.tsx` | Güncellendi | 5 section kompozisyonu + EN SEO metadata + hreflang alternates. |
| `frontend/app/tr/page.tsx` | Güncellendi | TR karşılığı, aynı iskelet. |
| `frontend/__tests__/ProductCard.test.tsx` | Yeni | 5 test (render, href EN/TR, placeholder, truncate). |
| `frontend/__tests__/BlogCard.test.tsx` | Yeni | 4 test (render, `<time>`, null publishedAt, TR prefix). |

## Backend veri sözleşmeleri

| Endpoint | Tüketici | Cache tag | Revalidate | Fallback |
|---|---|---|---|---|
| `GET /api/products?locale=en\|tr` → `ProductListItem[]` | `ProductShowcase` | `products` | 300 s | boş dizi + "empty state" |
| `GET /api/blog?locale=...&type=blog&page=1&pageSize=3` → `Paginated<BlogListItem>` | `LatestBlog` | `blog` | 300 s | boş dizi + "empty state" |
| `GET /api/announcement-bar?locale=...` | `AnnouncementBar` (layout) | `announcement-bar` | 60 s | null (gizlenir) |
| `GET /api/offices?locale=...` | `Footer` (layout) | `offices` | 600 s | boş dizi (blok gizlenir) |

Backend kapalı (örn. ilk deploy, bakım) veya 5xx dönüşte **sayfa asla 500
olmaz** — fetch wrapper `try/catch` ile boş içerik döner, bölüm boş-state
kartını render eder.

## SEO & metadata

- Her iki anasayfa `<title>`, `<description>`, OpenGraph ve `alternates.languages`
  (`en`, `tr`) içerir → hreflang ilişkisi kuruluyor.
- `canonical` EN için `/`, TR için `/tr`.
- ADIM 18'de sitemap'e ve structured data'ya entegre edilecek.

## Önemli mimari kararlar

1. **Heroicons / Lucide yerine inline `Icon.tsx`.** 4-6 ikon yeterli;
   runtime JS bundle'ına ek paket eklemeye değmez. `currentColor` ile
   Tailwind class'larından renkleniyor. Gerektiğinde ikon eklemek 10 satır.
2. **Product/Blog kart'ları aynı DNA.** `shadow-card` → hover'da `-translate-y-1`
   + `shadow-card-hover` + arrow `translate-x-1`. Bu pattern ADIM 14-16'da
   ürün listeleme, kaynak kartları, ilgili içerik gibi yerlerde yeniden
   kullanılacak — component zaten izole.
3. **Boş-state her zaman render edilir.** Backend boş dizi dönse bile
   section başlığı + CTA kalıyor, kullanıcı "content fail etti" diye
   düşünmüyor. Dashed border + "kayıt yok" metni developer friendly.
4. **Revalidate süreleri farklı.** Ürünler/blog: 5 dk (ADIM 9 revalidate
   tetikleri zaten anında invalidate ediyor, 5 dk sadece son koruma).
   Ofisler: 10 dk (backend cache'iyle eşleşiyor). Announcement: 1 dk
   (kampanya metni anlık değişebilir).
5. **Server component + no client islands.** Cards tamamen static HTML,
   link tıklama zaten Next.js client routing. React Query'e ihtiyaç yok —
   anasayfa tamamen prerender edilebilir.

## Testler

| Dosya | Senaryo | Durum |
|---|---:|---|
| `Highlight.test.tsx` | 4 | ✅ |
| `utils.test.ts` | 9 | ✅ |
| `LocaleSwitcher.test.tsx` | 7 | ✅ |
| `Navbar.test.tsx` | 5 | ✅ |
| `AnnouncementBarClient.test.tsx` | 4 | ✅ |
| `ProductCard.test.tsx` | 5 | ✅ yeni |
| `BlogCard.test.tsx` | 4 | ✅ yeni |
| **Toplam** | **38** | ✅ hepsi pass |

## Doğrulama

| Kontrol | Komut | Sonuç |
|---|---|---|
| TypeScript | `npm run type-check` | ✅ 0 error |
| ESLint | `npm run lint` | ✅ 0 warning |
| Jest | `npm test` | ✅ 38/38 pass |
| Next build | `npm run build` | ✅ `/` 101 kB, `/tr` 101 kB (prerendered static) |

Build sırasında backend kapalı olduğu için `sfetch('/products')` ve
`/blog` fail oldu; ProductShowcase ve LatestBlog kendi empty-state'ine
düştü. Sayfa yine de derlendi — fail-safe kontratı çalışıyor.

## Manuel test checklist

- [ ] `cd backend && npm run start:dev` — backend aç
- [ ] Admin paneli olmadığı için seed ile ürün/blog ekle:
  - [ ] `npm run seed` (backend'de, birkaç ürün + blog yaratır)
- [ ] `cd frontend && npm run dev` → `http://localhost:3000`
  - [ ] Hero: eyebrow + Highlight'lı başlık + 2 CTA + gradient + accent glow
  - [ ] ProductShowcase: 6'ya kadar kart, empty değil, hover animasyonu
  - [ ] ValueProps: 4 kart, ikon renkleri accent
  - [ ] LatestBlog: 3 kart, `publishedAt` lokalize
  - [ ] CtaSection: koyu zemin + 2 buton
- [ ] `/tr` — aynı akış, Türkçe metin
- [ ] Backend kapat → refresh → section'lar empty-state'e düşsün, sayfa yaşasın
- [ ] Mobile (375px) — tüm grid'ler tek sütuna çöksün
- [ ] DevTools Lighthouse → Performance > 90, Accessibility > 95

## Olası problemler

| Problem | Sebep | Çözüm |
|---|---|---|
| Ürün kartında resim görünmez | Backend `ogImage` null | Placeholder (ilk harf gradient) zaten devreye girer |
| Blog kartında "Invalid Date" | `publishedAt` hatalı format | Backend ISO string döndüğünden emin ol; `formatDate` try/catch yerine backend doğrulamasına güveniyoruz |
| Ürünler/blog section'ları empty kalır ama backend dolu | `.env.local` `NEXT_PUBLIC_API_URL` yanlış | `http://localhost:4000` set et; `sfetch` base URL'i buradan okur |

## Sonraki adım — ADIM 14

Ürün detay sayfası:
- `app/(site)/products/[slug]/page.tsx` + `app/tr/products/[slug]/page.tsx`
- `generateStaticParams` ile yayınlanmış ürünlerin SSG'si
- `generateMetadata` — ürün `metaTitle`/`metaDescription`/`ogImage`
- Hero: başlık + shortDescription + CTA
- Sections: solution, howItWorks, keyBenefits, productFamily, videos
- Breadcrumb navigation
- Related products
- Structured data (Product JSON-LD)
