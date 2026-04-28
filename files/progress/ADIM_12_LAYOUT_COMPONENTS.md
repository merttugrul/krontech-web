# ADIM 12 — Layout componentleri (Navbar, AnnouncementBar, Footer, LocaleSwitcher)

**Durum:** ✅ Tamamlandı
**Tarih:** 2026-04-20
**Önceki adım:** ADIM 11 (Tailwind config + Krontech renk paleti)
**Sonraki adım:** ADIM 13 (Ana sayfa — gerçek hero + ürün + blog blokları)

## Amaç

Tüm marketing sayfalarının paylaşacağı iskelet bileşenleri kurmak:

- **Navbar** — logo, primary menu, mobile hamburger, scroll shrink
- **AnnouncementBar** — backend'den aktif duyuru (RSC fetch), dismiss localStorage
- **Footer** — 4 sütun + office'ler (backend RSC fetch) + copyright
- **LocaleSwitcher** — path-preserving EN ↔ TR geçişi
- **SiteShell** — yukarıdakileri birleştiren wrapper

Admin paneli (ADIM 19) bu shell'i kullanmayacağı için marketing sayfalarını
`app/(site)/` route group'una taşıdık. TR karşılığı `app/tr/` altında.

## Rotalama mimarisi

### Önceden
```
app/
├── layout.tsx          (root — html + providers)
├── page.tsx            (EN home)
└── tr/page.tsx         (TR home)
```

### Şimdi
```
app/
├── layout.tsx          (root — html + fonts + providers, minimal)
├── providers.tsx       (React Query — unchanged)
├── globals.css         (ADIM 11 — unchanged)
├── (site)/
│   ├── layout.tsx      (<SiteShell locale="en">)
│   └── page.tsx        (EN home, URL = /)
├── tr/
│   ├── layout.tsx      (<SiteShell locale="tr">)
│   └── page.tsx        (TR home, URL = /tr)
└── api/revalidate/     (unchanged)
```

`(site)` route group URL'de görünmez (`/(site)/page` → `/`). Avantaj: ileride
`app/admin/layout.tsx` yazıldığında site shell'i kalıtlamadan farklı bir
iskelet kullanabilir.

## Oluşturulan / güncellenen dosyalar

| Dosya | Tür | Özet |
|---|---|---|
| `frontend/lib/i18n.ts` | Yeni | Dictionary (nav/footer/announcement/common), EN + TR. `copyright` template string — fonksiyon değil (client serialize sorunu önlenir). |
| `frontend/components/ui/Logo.tsx` | Yeni | Placeholder `kron.` wordmark, `variant: 'dark' \| 'white'`, locale-aware home link. |
| `frontend/components/ui/LocaleSwitcher.tsx` | Yeni | Client component, saf `computeHrefs()` yardımcısı export eder (test edilebilir). |
| `frontend/components/layout/Navbar.tsx` | Yeni | Client; scroll shrink, hamburger, body scroll lock, active state. |
| `frontend/components/layout/AnnouncementBar.tsx` | Yeni | Server; `sfetch('/announcement-bar?locale=...')` — backend 5xx/down ise `null`. |
| `frontend/components/layout/AnnouncementBarClient.tsx` | Yeni | Client; dismiss + localStorage (`kron-ab-dismissed` → duyuru id). |
| `frontend/components/layout/Footer.tsx` | Yeni | Server; 4 kolon nav + office grid (sfetch). Copyright template replace. |
| `frontend/components/layout/SiteShell.tsx` | Yeni | `AnnouncementBar + Navbar + main + Footer` kompozisyonu. |
| `frontend/app/(site)/layout.tsx` | Yeni | `<SiteShell locale="en">` |
| `frontend/app/(site)/page.tsx` | Yeni | EN home (eski `app/page.tsx`'ten taşındı, güncellendi). |
| `frontend/app/tr/layout.tsx` | Yeni | `<SiteShell locale="tr">` + hreflang alternates metadata. |
| `frontend/app/tr/page.tsx` | Güncellendi | Shell artık layout'tan gelir — sayfa sadece hero içerir. |
| `frontend/app/page.tsx` | **Silindi** | (site) grubuna taşındı. |
| `frontend/__tests__/LocaleSwitcher.test.tsx` | Yeni | 7 test: path rewriting, trailing slash, yanıltıcı prefix. |
| `frontend/__tests__/Navbar.test.tsx` | Yeni | 5 test: nav labels EN/TR, hamburger toggle, active state, href prefix. |
| `frontend/__tests__/AnnouncementBarClient.test.tsx` | Yeni | 4 test: render, dismiss + localStorage, yeniden render, id değişince reset. |

## Veri sözleşmeleri (backend ↔ frontend)

| Endpoint | Frontend tüketicisi | Tag | Revalidate |
|---|---|---|---|
| `GET /api/announcement-bar?locale=en\|tr` → `{ announcement: AnnouncementBar \| null }` | `AnnouncementBar.tsx` (RSC) | `announcement-bar` | 60 s |
| `GET /api/offices?locale=en\|tr` → `Office[]` | `Footer.tsx` (RSC) | `offices` | 600 s |

Backend hata durumunda (network, 5xx, 4xx) komponentler **sessiz fallback**
döndürür: duyuru gizlenir, footer'da ofis bloğu basılmaz. Sayfa kendisi
hiçbir zaman bu yüzden 500'e düşmez.

## Önemli mimari kararlar

1. **Route group (site) vs. dynamic `[locale]`.**
   ODEV.md'deki URL yapısı: EN için prefix yok (`/products`), TR için `/tr/products`.
   Dynamic `[locale]` segment kullanırsak EN URL'ler de `/en/...` olmak zorunda
   veya middleware yeniden yazım lazım — SEO'da hem karmaşa hem canonical
   sorun. Statik iki ağaç (`(site)/` + `tr/`) duplicate gibi görünse de **layout
   ve shell bileşeni paylaşıldığı için** gerçek kod tekrarı yok. Sayfa içerik
   bileşenleri (ADIM 13+) locale'i prop olarak alacak ortak component'lar
   olarak yazılacak.

2. **AnnouncementBar: server fetch + client dismiss ayrımı.**
   SSR'da metin HTML'e basılır — CLS ve SEO için kritik. Dismiss durumu
   sadece client'ta biliniyor (localStorage), bu yüzden `AnnouncementBarClient`
   ayrı dosyada. İlk render'da `aria-hidden={!hydrated}` ile screen reader'a
   geçici "yok" diyoruz; hydration tamamlanınca devreye giriyor.

3. **Dictionary serializable olmalı.**
   İlk revizyonda `copyright: (year) => string` fonksiyonu vardı. Server layout
   dictionary'i Navbar (client) komponente prop geçince Next `Functions cannot
   be passed directly to Client Components` hatası verdi. Fonksiyonu
   `'© {year} ...'` template string'e çevirip Footer içinde `.replace('{year}', ...)`.
   Client component prop kontratları için **payload'ın JSON-serializable olmak
   zorunda** olduğunu unutmayalım — ileride tüm i18n katmanında bu kural
   geçerli.

4. **`usePathname()` Navbar'da aktif state için.**
   `/products` ya da `/products/telemetry` her ikisinde de "Products" linki
   aktif görünsün istiyoruz — `pathname.startsWith(href + '/')` kontrolü
   bunun için. Ana sayfa (`/` veya `/tr`) için özel durum: tam eşleşme.

5. **Scroll shrink.**
   Hero'nun tepesinde (scrollY < 16) navbar transparan → link yazıları beyaz.
   Scroll sonrası beyaz zemin + shadow. `useEffect`'te `passive: true`
   scroll listener; component unmount'ta cleanup. Mobile'da body scroll lock
   (`overflow:hidden`) açık iken.

6. **TypedRoutes kaçış.**
   Henüz var olmayan sayfalara (`/contact`, `/tr/contact`) yapılan linkler
   `typedRoutes` tipiyle uyuşmuyor — `as '/'` cast ile by-pass. Sayfalar
   oluştuktan sonra bu cast'ler silinebilir; `Route` tipine geçmeyi `eslint`
   rule'u ile ileride zorlayabiliriz.

## Testler (Jest + React Testing Library)

| Dosya | Senaryo sayısı | Kapsam |
|---|---:|---|
| `Highlight.test.tsx` | 4 | Variant, className merge, içerik erişilebilirliği (ADIM 11'den) |
| `utils.test.ts` | 9 | Locale helpers, cn, truncate, formatDate (ADIM 10'dan) |
| `LocaleSwitcher.test.tsx` | 7 | Path rewriting (EN↔TR, trailing slash, yanıltıcı prefix) |
| `Navbar.test.tsx` | 5 | EN/TR labels, hamburger toggle, active state, href prefix |
| `AnnouncementBarClient.test.tsx` | 4 | Render, dismiss + localStorage, yeniden render, id değişince reset |
| **Toplam** | **29** | ✅ hepsi pass |

## Doğrulama

| Kontrol | Komut | Sonuç |
|---|---|---|
| TypeScript | `npm run type-check` | ✅ 0 error |
| ESLint | `npm run lint` | ✅ 0 warning |
| Jest | `npm test` | ✅ 29/29 pass |
| Next build | `npm run build` | ✅ `/`, `/tr` static, `/api/revalidate` dynamic |

## Manuel test checklist

- [ ] `npm run dev` → `http://localhost:3000`
  - [ ] Hero transparent üstünde beyaz navbar linkleri
  - [ ] Scroll sonrası beyaz navbar + shadow, linkler koyu
  - [ ] Desktop ≥1024px: 5 link + LocaleSwitcher + "Get a Demo" CTA
  - [ ] <1024px: hamburger; tıklayınca tam genişlik sheet açılır
  - [ ] Sheet içinde tüm linkler + CTA + LocaleSwitcher
- [ ] `/tr` yolunda aynı davranış, Türkçe etiketler (Ürünler, İletişim, Demo İste)
- [ ] LocaleSwitcher `/products/x` → `/tr/products/x`; `/tr/blog/y` → `/blog/y`
- [ ] Footer'da 4 kolon + (backend açıksa) ofis grid'i + telif
- [ ] Backend kapalı durumdayken footer ofis bloğu hiç görünmesin
- [ ] Backend'de duyuru yaratıp `isActive=true` set edince üstte kara şerit görünür
- [ ] Dismiss X'ine tıklayınca kaybolur; sayfa yenilense bile gelmez
- [ ] Backend'de duyuru metnini değiştirip yeni id yayınlayınca tekrar görünür
- [ ] Tab'la klavyeden `EN | TR` butonları, hamburger, hero CTA'lar gezilebilir

## Olası problemler & çözümler

| Problem | Sebep | Çözüm |
|---|---|---|
| `Functions cannot be passed directly to Client Components` | Dictionary `copyright` fonksiyonu SiteShell → Navbar prop yolu | Fonksiyonu `{year}` token'lı string'e çevir, kullanım yerinde `.replace()` |
| `Type '"/contact"' is not assignable to type RouteImpl<...>` | typedRoutes, sayfa yok | `as '/'` cast; ADIM 17'de gerçek sayfa eklenince kaldır |
| `.next/types/app/page.ts` eski page'i arıyor | `app/page.tsx` silindi, cached types | `rm -rf .next` |
| Unescaped `'` JSX text ESLint | React kuralı | `component&apos;ları` şeklinde HTML entity |

## Sonraki adım — ADIM 13

Ana sayfa gerçek içerikle:

1. **HeroSection** — arka plan gradient + büyük başlık + CTA (backend'de hero
   içeriği ürün temelli olacak; statik başlayıp gerektiğinde CMS'e bağlarız).
2. **HighlightProducts** — öne çıkan ürünler grid/swiper (backend `GET /api/products`).
3. **ValueProps** — 3-4 ikonlu özellik bloğu.
4. **LatestBlog** — son 3 blog (backend `GET /api/blog?limit=3`).
5. **CTASection** — demo başvuru.

Tüm bileşenler server component, veriyi `sfetch` ile çekecek; hero/cta'daki
mikro-etkileşimler client island.
