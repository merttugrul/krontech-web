# ADIM 11 — Tailwind config + Krontech renk paleti

**Durum:** ✅ Tamamlandı
**Tarih:** 2026-04-20
**Önceki adım:** ADIM 10 (Next.js frontend kurulumu)
**Sonraki adım:** ADIM 12 (Layout componentleri — Navbar, Footer, AnnouncementBar)

## Amaç

Frontend'in geri kalanını (hero, card, button, form, admin panel) tek bir
tutarlı tasarım diliyle yazabilmek için Krontech kurumsal renk paletini,
tipografi ölçeklerini ve tekrarlı component pattern'larını tema katmanına
(`tailwind.config.ts` + `globals.css`) taşımak.

PLAN.md'de tanımlı değerler (kron.navy/blue/accent/light/gray/dark) ve
"heading highlight efekti: mavi altı çizili kelimeler" davranışı bu adımda
kodlandı.

## Oluşturulan / güncellenen dosyalar

| Dosya | Değişiklik |
|---|---|
| `frontend/tailwind.config.ts` | Kron palette (named + 50-950 scale), `display-*` font boyutları, `container`, custom `shadow-card/hero`, `bg-kron-hero/accent-bar` gradient'leri, `fade-in-up` animasyonu. |
| `frontend/app/globals.css` | `:root` CSS değişkenleri, `@layer base` heading/body tipografi, `@layer components` → `.hl` / `.hl-underline` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-inverse` / `.container-tight` / `.section`, `@layer utilities` → `.text-balance` / `.text-pretty`. |
| `frontend/components/ui/Highlight.tsx` | `<Highlight variant="bar" \| "underline">` reusable component. |
| `frontend/app/page.tsx` | Hero + "Design Token Preview" bölümü eklendi — palette'in bütün varyasyonları ve `<Highlight>` kullanımı canlı doğrulanıyor. |
| `frontend/app/tr/page.tsx` | TR karşılığı güncellendi, aynı dil ve pattern. |
| `frontend/__tests__/Highlight.test.tsx` | 4 unit test (default variant / underline variant / className merge / içerik erişilebilirliği). |
| `frontend/jest.config.mjs` | `.next/standalone` altındaki `package.json` nedeniyle çıkan haste-map collision uyarısı için `modulePathIgnorePatterns` eklendi. |

## Renk sistemi

### Named aliaslar (component'larda birincil kullanım)

| Token | Hex | Nerede |
|---|---|---|
| `kron-navy` | `#0a1628` | hero arka planı |
| `kron-blue` | `#1e3a8a` | primary buton hover, başlık metin |
| `kron-accent` | `#2563eb` | CTA, highlight |
| `kron-light` | `#3b82f6` | link, açık rozet |
| `kron-gray` | `#f8fafc` | section arka planı |
| `kron-dark` | `#0f172a` | footer, gövde metni |

### Numeric scale (tint/shade ihtiyaçları)

`kron-50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950` — Tailwind'in
standart numeric scale semantiği. 400 = accent'in bir tık açığı, 600 = blue,
900 = navy, 950 = dark. Active/hover state'leri ayrı component custom CSS
yazmadan buradan çekiliyor (örn. `active:bg-kron-800`).

## Component pattern'ları

### `.hl` — başlık highlight

Kullanım:
```tsx
<h1>Kron <span className="hl">Telemetry Pipeline</span></h1>
// ya da:
<h1>Kron <Highlight>Telemetry Pipeline</Highlight></h1>
```

Davranış: `inline-block`, `font-semibold`, `text-kron-accent`, altında 3px
yüksek gradient çubuk (`::after`). Bu çubuk `theme('backgroundImage.kron-accent-bar')`'ı
çeker — tek bir config değişikliği tüm highlight'ları değiştirir.

Alternatif: `.hl-underline` (klasik `text-decoration: underline`) — blog gövde
metni içinde kullanmak için.

### `.btn-*` — kurumsal buton ailesi

| Variant | Amaç |
|---|---|
| `btn-primary` | Ana CTA — `bg-kron-accent` zemin |
| `btn-secondary` | İkincil aksiyon — beyaz, hover'da accent border |
| `btn-ghost` | Menü/nav aksiyonları — transparan, hover'da hafif gri |
| `btn-inverse` | Koyu zeminler (hero) üzerinde kullanım — beyaz zemin, accent text |

Hepsi `focus-visible:ring-2 focus-visible:ring-kron-accent` erişilebilirlik
halkasıyla geliyor. Klavye kullanıcıları gözden kaçmıyor.

### `.section` ve `.container-tight`

- `.section` — `py-16 sm:py-20 lg:py-24` — marketing sayfalarının standart
  dikey spacing'i.
- `.container-tight` — `max-w-3xl` — blog yazı gövdesi için okuma sütunu.

### Typography utility'leri

- `text-balance` / `text-pretty` — CSS4 `text-wrap` desteği. Hero başlıklar
  ve paragraflarda kullanıyoruz. Fallback: desteklemeyen tarayıcılar bunu
  yok sayıyor, görsel regresyon yok.

## Mimari kararlar

1. **Named + numeric scale birlikte.** Component'lar okunurluk için named
   alias ("bg-kron-navy"), microstate'ler ("hover:bg-kron-700") numeric.
   Tek bir renk tanımlandığında IDE autocompletion iki şekilde de kapsıyor.
2. **Highlight `::after` ile çubuk, `text-decoration` değil.** Underline
   thickness tarayıcılar arasında tutarsız (Safari ince, Chrome kalın) —
   gradient pseudo-element piksel-mükemmel kontrol veriyor ve gradient
   efekti native underline'la imkansız.
3. **Buton stilleri CSS component layer'ında.** Her sayfaya `<Button>`
   component'i import etmek zorunda kalmadan, `<Link className="btn-primary">`
   yazarak aynı görünümü alabiliyoruz. Admin panelin form'larında aynı class
   kullanılıyor — DRY.
4. **Haste-map ignore.** `.next/standalone` çıktısı build sonrası kendi
   `package.json`'ını kopyaladığı için jest-haste-map collision uyarısı
   veriyordu; `modulePathIgnorePatterns` ile bastırıldı. Build pipeline'ı
   etkilenmiyor.

## Doğrulama

| Kontrol | Komut | Sonuç |
|---|---|---|
| TypeScript | `npm run type-check` | ✅ 0 error |
| ESLint | `npm run lint` | ✅ 0 warning / error |
| Jest | `npm test` | ✅ 13/13 pass (9 utils + 4 Highlight) |
| Next build | `npm run build` | ✅ `/` ve `/tr` static, revalidate API dynamic |

Browser preview: hero'nun mavi gradient arka planı, "Telemetry Pipeline"
altındaki accent çubuğu, palette kart grid'i `http://localhost:3000` açılınca
görünür. `/tr` yolunda aynı layout Türkçe metinle çalışıyor.

## Manuel test checklist

- [ ] `npm run dev` → `http://localhost:3000` — hero, highlight, CTA'lar
      görünür mü?
- [ ] `/tr` rotasında TR metin ve aynı stil görünüyor mu?
- [ ] DevTools → CSS paneli → `.hl` class'ı altında `::after` gradient çubuk var mı?
- [ ] Klavye `Tab` tuşu ile CTA buton üzerine gidildiğinde mavi focus ring görünüyor mu?
- [ ] Mobile (375px) ve desktop (1440px) snapshot'lar arasında heading
      wrap'leri okunaklı mı? (`text-balance` devreye girmiş mi?)
- [ ] `kron-navy/blue/accent/light/gray/dark` kartları renk manual'le
      (`files/ODEV.md`) bire bir uyuşuyor mu?

## Sonraki adım — ADIM 12

Layout componentleri:

1. **`Navbar`** — logo + primary menu (Products, Solutions, Resources,
   Blog, Contact) + CTA buton + mobile hamburger. Scroll'da shrink.
2. **`AnnouncementBar`** — backend `/api/announcement-bar?locale=en`
   endpoint'ini tüketir, kapatma ikonu ile localStorage'a kaydeder.
3. **`Footer`** — 4 sütun (Company, Products, Resources, Legal) + office
   adresleri (backend `/api/offices?locale=en`) + sosyal medya.
4. **`LocaleSwitcher`** — mevcut path'i koruyarak EN/TR geçişi.

Layout'lar `app/layout.tsx` içinde global olarak mount edilecek; RSC ile
veri çekimi `sfetch` helper üzerinden yapılacak.
