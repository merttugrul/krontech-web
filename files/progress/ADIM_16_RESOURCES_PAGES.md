# ADIM 16 — Kaynaklar Sayfaları (Resources)

Yayın tarihi: ADIM 16 tamamlandı.
Bu adımda frontend tarafında **Kaynaklar (Resources)** listeleme ve detay sayfaları
hayata geçirildi. Backend tarafında ilgili modül ADIM 7'de implemente edilmişti;
bu adım sadece public UI katmanını ekler.

## 1. Amaç

- `/resources` ve `/tr/resources` altında bir listeleme sayfası sun:
  - Type tab'ları (All / Datasheets / Case studies / Whitepapers).
  - 12'li grid + sayfa numaralı pagination.
- `/resources/[id]` ve `/tr/resources/[id]` altında detay sayfası sun:
  - Hero + breadcrumb + type badge.
  - Cover image + full description.
  - Primary CTA: PDF indir (yeni sekmede, `download` attribute).
  - Related resources (aynı type, 3 adet).
  - JSON-LD: `Article` + `BreadcrumbList`.
- Her iki locale'de tam i18n (EN/TR) desteği.
- SSG + `generateMetadata` ile SEO-friendly başlık, description ve hreflang
  alternates.

## 2. Yeni/Güncellenen Dosyalar

### 2.1 i18n

- `frontend/lib/i18n.ts`
  - `Dictionary` arayüzüne **`resources`** bloku eklendi (21 key).
  - EN ve TR sözlüklerine dolu içerik yazıldı.

### 2.2 Yardımcı modüller

- `frontend/lib/resources.ts` (yeni)
  - `resourceTypeLabel(type, dict)` — `ResourceType` → i18n label eşlemesi.
  - `parseResourceTypeParam(raw)` — URL'den gelen `?type=` parametresini
    doğrular; geçersiz değerlerde `null` (tümü) döner.

### 2.3 UI bileşenleri

- `frontend/components/ui/ResourceCard.tsx` (yeni)
  - Cover image (veya gradient + Icon fallback) + type badge.
  - Başlık, kısa açıklama (truncate 140 karakter).
  - İki CTA: "Read more" (detay) + "Download PDF" (direkt indir).
  - `fileUrl` yoksa indirme CTA gizlenir.

### 2.4 Section composer'lar

- `frontend/components/sections/resources/ResourceListingPage.tsx` (yeni)
  - RSC. Hero + breadcrumb + filter tab'ları + grid + pagination.
  - Backend hatasında fail-safe empty state.
  - `revalidate: 300` + `tags: ['resources']`.
- `frontend/components/sections/resources/ResourceDetailPage.tsx` (yeni)
  - RSC. Hero + cover + description paragraphs + related.
  - `JsonLd` ile `Article` + `BreadcrumbList` yayınlar.
  - `notFound()` fallback — backend 404 dönerse.
  - Dışa açık yardımcılar:
    - `fetchResourceForMetadata(id, locale)` — metadata üretimi için.
    - `listPublishedResourceIds(locale)` — `generateStaticParams` için.

### 2.5 Route sayfaları (4 adet)

- `frontend/app/(site)/resources/page.tsx` — EN listeleme (dynamic).
- `frontend/app/tr/resources/page.tsx` — TR listeleme (dynamic).
- `frontend/app/(site)/resources/[id]/page.tsx` — EN detay (SSG + dynamic fallback).
- `frontend/app/tr/resources/[id]/page.tsx` — TR detay (SSG + dynamic fallback).

Her sayfa:
- `generateMetadata` ile kaynak-özgü başlık/açıklama/OG image.
- `alternates.languages` ile EN↔TR hreflang bağlantısı.
- Listeleme sayfaları: `searchParams.page` + `searchParams.type`.

### 2.6 Testler

- `frontend/__tests__/resources-helpers.test.ts` (yeni, 7 case)
  - `parseResourceTypeParam`: geçerli/geçersiz/undefined/boş.
  - `resourceTypeLabel`: EN/TR için doğru label dönüyor mu.
- `frontend/__tests__/ResourceCard.test.tsx` (yeni, 4 case)
  - Başlık/badge/description render.
  - `fileUrl` varken indirme link'i doğru href + `target="_blank" rel="noopener"`.
  - `fileUrl` null ise indirme link'i yok.
  - TR locale'de detay link'i `/tr/resources/...` prefix alıyor.

## 3. Teknik kararlar

### 3.1 Routing — Tek listeleme + type filter

Alternatif yollar:

| Seçenek | Avantaj | Dezavantaj |
|--|--|--|
| `/resources/datasheets`, `/resources/case-studies` … ayrı rotalar | Her type ayrı metadata, SEO açısından farklı URL'ler | 3× sayfa duplikasyonu; filter bar UX ikilemi |
| **`/resources?type=...` tek sayfa** (seçilen) | Tek route + tek bileşen; filter UX doğal | SEO'da tek URL; ama zaten bu sayfalar marketing landing değil |

Kaynak kartları zaten detay sayfasına yönlendiriyor — type-specific landing
sayfası ileride ihtiyaç doğarsa `/resources/datasheets` gibi ek rotalar
kolayca eklenebilir.

### 3.2 Detay sayfası: ID-based

Backend `Resource` tablosunda **slug** yok — primary key UUID. Bu yüzden detay
URL'leri `/resources/<uuid>` biçiminde. İleride SEO değeri yüksek bir case
study seti çıkarsa backend'e `slug` kolonu eklenebilir; bu kararı erken
vermiyoruz çünkü:

- Kaynaklar ağırlıkla PDF'e linkleyen kart — kullanıcı URL'yi ezberleyeceği bir
  içerik değil.
- Case study başlıkları zamanla değişebilir (customer isim koruması vs.).
- UUID kolayca stabil canonical'a sahip.

### 3.3 `description` rendering

Backend `description` alanı plaintext (single field). Detail sayfasında
`\n\n` ayraçlarından paragraflara bölüyoruz ve `prose` class'ı ile tipografiyi
Tailwind Typography'e bırakıyoruz. İleride rich text istenirse blog modelinde
olduğu gibi ayrı `content` kolonu + `sanitizeContent` gerekir.

### 3.4 Related resources

Aynı `type` + aynı `locale`'deki **en son 4** kaynağı çekiyor, mevcut olanı
eliyor, ilk 3'ü gösteriyor. Pagination açısından küçük ama doğru; 10K+ kaynak
senaryosu için "tag tabanlı ilişkilendirme" gerekir — şu an kapsam dışı.

### 3.5 JSON-LD `Article`

Resources için `Product` veya `DownloadableDataset` yerine **`Article`**
seçildi:

- Google rich result'ları için `Article` en uyumlu genel şema.
- Case study'ler zaten article benzeri içerik.
- Datasheet/whitepaper için `Article` overuse değil — konusu teknik yazı.

`url` field'ı PDF'e set ediliyor böylece Google rich result'larında PDF
icon'unu görebilir.

### 3.6 Fail-safe data fetching

- Backend kapalıyken:
  - Listing: boş state (hata yazısı yok).
  - Detail: `notFound()` → 404.
  - Related: boş dizi (section render edilmez).
  - `generateStaticParams`: `[]` → Next.js on-demand SSR fallback.

Bu sayede build-time veya runtime'da backend erişim sorunu tüm siteyi
bloklamıyor.

## 4. Test Sonuçları

| Komut | Sonuç |
|--|--|
| `npm run type-check` | ✔ 0 error |
| `npm run lint` | ✔ 0 warning |
| `npm test` | ✔ **98/98** pass (11 yeni) |
| `npm run build` | ✔ 18 route (4 yeni: resources × 2 locale × listing/detail) |

Yeni route'lar build çıktısında:

```
├ ƒ /resources                    (Dynamic — search params)
├ ● /resources/[id]               (SSG + fallback)
├ ƒ /tr/resources                 (Dynamic — search params)
└ ● /tr/resources/[id]            (SSG + fallback)
```

## 5. Manuel Doğrulama Checklist

Aşağıdakileri tarayıcıda doğrula (backend + admin paneli ile seed'li):

- [ ] `/resources` açılıyor, hero + breadcrumb + 4 filter tab görünüyor.
- [ ] Tab'lara tıklanınca URL `?type=datasheet` vs. şeklinde değişiyor ve
      grid filtreleniyor.
- [ ] `?type=geçersiz` → "All" davranışı (boş filter).
- [ ] `?page=2` → ikinci sayfaya gidiyor, pagination aktif.
- [ ] Kartta cover image yoksa mavi gradient + icon görünüyor.
- [ ] "Download PDF" butonu yeni sekmede PDF'i açıyor (veya indiriyor).
- [ ] "Read more" detay sayfasına götürüyor.
- [ ] `/resources/<uuid>` açılıyor, breadcrumb doğru, full description
      paragrafları render ediliyor.
- [ ] Detay sayfasında `Download PDF` butonu hero'da görünüyor.
- [ ] Related resources bölümü aynı type'tan 0-3 kart gösteriyor.
- [ ] TR muadilleri: `/tr/resources` ve `/tr/resources/<uuid>` TR i18n metinleri
      ile açılıyor, hreflang EN karşılığına işaret ediyor.
- [ ] DevTools → Elements → `<script type="application/ld+json">` içinde
      `Article` ve `BreadcrumbList` mevcut.
- [ ] Mevcut olmayan bir ID girilince 404 sayfası geliyor.
- [ ] Mobile'da (<640px) filter tab'ları satır kaydırıyor, grid 1 kolona iniyor.

## 6. Sonraki Adım

ADIM 17: Contact sayfası + form (reCAPTCHA).
