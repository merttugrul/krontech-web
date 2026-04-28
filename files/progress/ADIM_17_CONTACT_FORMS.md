# ADIM 17 — Contact Sayfası + Form (reCAPTCHA)

Bu adımda frontend'e **Contact** ve **Request a Demo** sayfaları eklendi.
İki sayfa da backend'deki `/api/forms/contact` ve `/api/forms/demo`
endpoint'lerini (ADIM 7'de implemente edildi) tüketir.

## 1. Amaç

- `/contact` ve `/tr/contact` altında:
  - Kurumsal hero + breadcrumb.
  - Soldan ofis listesi (backend `offices` endpoint'i — ADIM 8).
  - Sağdan contact form (name, email, company?, phone?, message).
- `/demo` ve `/tr/demo` altında:
  - Kurumsal hero + breadcrumb.
  - Soldan "neden demo" value props (4 bullet + icon).
  - Sağdan demo form (name, email, company, jobTitle?, phone?,
    productInterest?, message?).
- Spam koruması **üç katmanlı**:
  1. **Honeypot** (`website` field) — DOM'da gizli; bot dolduran → sessiz
     success.
  2. **Google reCAPTCHA v3** — submit anında `executeRecaptcha` ile token
     alınır, backend doğrular.
  3. **Rate limit** — backend 5 req/dk/IP (ADIM 7 `@Throttle`).
- Her iki dilde i18n (EN/TR), erişilebilir (label/aria/role/alert).

## 2. Yeni/Güncellenen Dosyalar

### 2.1 i18n

- `frontend/lib/i18n.ts`
  - `Dictionary` arayüzüne **`contact`** bloku eklendi (~40 key + `validation`
    alt-bloğu 8 key).
  - EN + TR için dolu içerik.

### 2.2 Zod şemaları

- `frontend/lib/schemas/contact.ts` (yeni)
  - `buildContactSchema(dict)` + `buildDemoSchema(dict)` — i18n'li hata
    mesajları için factory desen.
  - Telefon için esnek regex (`/^[+\d][\d\s\-().]{6,30}$/`) — uluslararası
    formatları kabul, boşluk/tire/parantez tolere eder.
  - Boş string → `undefined` transform (backend DTO opsiyonel alanları
    temiz alması için).
  - `ContactFormValues` ve `DemoFormValues` tipleri dışa açık.

### 2.3 Form altyapısı

- `frontend/components/forms/RecaptchaWrapper.tsx` (yeni)
  - **Shartlı** `GoogleReCaptchaProvider`. Site key yoksa veya placeholder
    değere ("YOUR_SITE_KEY") sahipse provider eklenmez — backend de benzer
    şekilde `RECAPTCHA_SECRET` yoksa doğrulamayı atlar.
  - Script loading `async + defer + head`.
- `frontend/components/forms/FormField.tsx` (yeni)
  - Reusable `FormField` (input) ve `FormTextarea` bileşenleri.
  - Label + input/textarea + error + help text + optional badge yapısı.
  - `aria-invalid`, `aria-describedby`, `role="alert"` destekleri.
  - `forwardRef` ile RHF `register` uyumu.
- `frontend/components/forms/ContactForm.tsx` (yeni)
  - RHF + `zodResolver` + `useGoogleReCaptcha()` birleştiren client
    component.
  - State: `idle | submitting | success | error`.
  - Honeypot field (absolute off-screen) tetiklenirse sessiz success.
  - Hata kodlarına göre farklı mesaj: 429 → rate limit, 401 →
    reCAPTCHA failure, diğer → generic.
  - `SuccessCard` reusable success UI (Demo formu da kullanır).
- `frontend/components/forms/DemoForm.tsx` (yeni)
  - Contact'a paralel ama `company` zorunlu, ek alanlar (jobTitle,
    productInterest). `message` opsiyonel.
  - Aynı success/error/rate-limit mantığı.

### 2.4 Page composer'lar

- `frontend/components/sections/contact/ContactPage.tsx` (yeni)
  - RSC. Hero + 2 kolon grid (offices aside + form card).
  - `fetchOffices()` fail-safe (`sfetch` hatası → boş liste, boş state
    metni).
- `frontend/components/sections/contact/DemoPage.tsx` (yeni)
  - RSC. Hero + 2 kolon grid (value props aside + form card).
  - 4 value prop bullet (EN/TR locale'e göre inline tanımlı — küçük liste,
    i18n sözlüğünü şişirmemek için).

### 2.5 Route sayfaları (4 adet, hepsi static)

- `frontend/app/(site)/contact/page.tsx` — EN contact.
- `frontend/app/tr/contact/page.tsx` — TR contact.
- `frontend/app/(site)/demo/page.tsx` — EN demo.
- `frontend/app/tr/demo/page.tsx` — TR demo.

Her sayfada `generateMetadata` (statik): EN↔TR hreflang + Open Graph.

### 2.6 Testler

- `frontend/__tests__/contact-schemas.test.ts` (yeni, 11 case)
  - Happy/sad path: name min, email invalid, message min/max.
  - Boş company/phone → undefined transform.
  - Telefon esnek format (`+90 555 000 00 00`).
  - Demo için `company` zorunlu (missing + empty).
  - Demo'da tüm opsiyonel alanlar valid.
- `frontend/__tests__/ContactForm.test.tsx` (yeni, 4 case)
  - `react-google-recaptcha-v3` + `@/lib/api` jest.mock'lanıyor.
  - Render kontrol (zorunlu alanlar + submit butonu).
  - Geçersiz email → validation error, submit çağrılmaz.
  - Happy path → API çağrısı (`recaptchaToken`, `locale`, `source` dahil)
    + success card render.
  - 429 → `errorRateLimited` mesajı.

## 3. Teknik kararlar

### 3.1 Neden `react-google-recaptcha-v3`?

- **v3** seçildi çünkü: UX friction yok (user challenge yok, invisible).
- "Do not support" / "I am not a robot" checkbox v2 feature'larına gerek yok.
- Paket React context'ini yönetir, `useGoogleReCaptcha` hook'u stable.

Alternatif değerlendirme:

| Paket | Tercih? | Not |
|--|--|--|
| `react-google-recaptcha` | Hayır | v2 only (checkbox), modern marketing site için overkill |
| `@hookform/devtools` + manuel fetch | Hayır | DX düşük, context'i kendimiz kurmak gerekir |
| **`react-google-recaptcha-v3`** | **Evet** | Minimal, hook-based, tree-shakable |

### 3.2 Form state yönetimi: RHF + zod

- `react-hook-form` — uncontrolled, minimal re-render, field-level validation.
- `zod` + `@hookform/resolvers/zod` — backend DTO'ya paralel schema.
- Factory pattern (`buildContactSchema(dict)`) — i18n error message'ları
  render zamanında resolve edilir.
- `mode: 'onBlur'` — kullanıcı field'ı terk ettiğinde hata gösterir,
  typing sırasında boğmaz.

### 3.3 Honeypot yaklaşımı

- CSS ile görünmez değil (`display:none` botların atladığı pattern):
  `absolute`, `-left-[9999px]`, `opacity-0`, `pointer-events-none`,
  `tabIndex={-1}`, `autoComplete="off"`.
- Bot dolduğunda **sessizce success göster** — hint vermeyelim.
- Backend de aynı field'ı kontrol eder (ADIM 7); double-layer.

### 3.4 Error mapping

Backend yanıt kodlarına karşılık frontend mesajları:

| HTTP | Frontend mesaj |
|--|--|
| 201 Created | Success card |
| 400 validation | Generic (alanlar zaten RHF'de validate edildi, buraya gelmemeli) |
| 401 reCAPTCHA reject | `errorRecaptcha` |
| 429 rate limit | `errorRateLimited` |
| 500 / network | `errorGeneric` |

### 3.5 Contact vs Demo ayrık sayfalar

Tek sayfa üzerinde "tab switcher" alternatifi değerlendirildi ama:

- İki form farklı user intent (support vs sales) — SEO için ayrı URL
  daha doğru (`/demo` için dedicated landing page mümkün).
- Demo page'de value prop column var, contact'ta office column — layout
  farklı.
- Backend zaten iki endpoint. URL'ler semantic.

### 3.6 Statik build olma sebebi

Contact/Demo sayfalarında runtime data fetch yok (office listesi ContactPage
RSC'sinde `sfetch` ile çekiliyor ama bu `revalidate: 600` ile cache'leniyor
ve build-time'da statik olarak render ediliyor). Sonuç: **`○ (Static)`** —
CDN-friendly, hızlı.

## 4. Test Sonuçları

| Komut | Sonuç |
|--|--|
| `npm run type-check` | ✔ 0 error |
| `npm run lint` | ✔ 0 warning |
| `npm test` | ✔ **113/113** pass (15 yeni: 11 schema + 4 form) |
| `npm run build` | ✔ 22 route (4 yeni: contact × 2 + demo × 2, hepsi static) |

Yeni route'lar build çıktısında:

```
├ ○ /contact          198 B    145 kB
├ ○ /demo             1.61 kB  146 kB
├ ○ /tr/contact       198 B    145 kB
└ ○ /tr/demo          1.61 kB  146 kB
```

First Load JS artışı ~45 kB (RHF + zod + zodResolver + axios + recaptcha
wrapper) — kabul edilebilir, sadece iletişim sayfalarında yüklenir.

## 5. Manuel Doğrulama Checklist

Backend ayağa kalktıktan ve admin paneli ofisler seed'lendikten sonra:

### Contact form (`/contact`)

- [ ] Sayfa açılıyor, hero + breadcrumb doğru.
- [ ] Sağda form card görünüyor (name, email, company, phone, message).
- [ ] Sol sütunda "Our offices" başlığı + ofis kartları görünüyor.
- [ ] Boş submit → 3 validation hatası (name, email, message).
- [ ] Geçersiz email → `emailInvalid` mesajı.
- [ ] Message < 10 karakter → `messageMin` mesajı.
- [ ] Geçersiz telefon (ör. "abc") → `phoneInvalid` mesajı.
- [ ] Geçerli verilerle submit → success card, form resetlenir.
- [ ] "Send another message" butonu idle state'e döner.
- [ ] Hızlı 6 submit denemesi → 6.sında rate limit mesajı (`errorRateLimited`).

### Demo form (`/demo`)

- [ ] Sayfa açılıyor, 4 value prop bullet + icon görünüyor.
- [ ] Company boş bırakılırsa `companyRequired` mesajı.
- [ ] Tüm opsiyonel alanları dolu submit → success.

### reCAPTCHA

- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` set edilmişse network
      tab'da `www.recaptcha.net/recaptcha/api.js` yükleniyor.
- [ ] Submit anında `POST /api/forms/contact` body'sinde
      `recaptchaToken` dolu.
- [ ] Key set edilmemişse (dev) — provider script eklenmez, submission
      hala çalışır (backend de skip ediyor).

### Honeypot

- [ ] DevTools → Elements → `#website` (contact) ve `#demo-website`
      inputları DOM'da ama görünmüyor.
- [ ] Manuel olarak JS ile doldurulup submit edilirse — UI success
      gösterir, backend log'unda submission yok (honeypot rejection).

### i18n & hreflang

- [ ] `/tr/contact` ve `/tr/demo` TR metinleriyle açılıyor.
- [ ] `<head>` içinde `<link rel="alternate" hreflang="en|tr" ...>` mevcut.
- [ ] Navbar LocaleSwitcher path-preserving (EN↔TR geçiş, path korunur).

## 6. Sonraki Adım

ADIM 18: SEO altyapısı (sitemap, robots, structured data, redirect middleware).
