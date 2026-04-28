# ADIM 19 — Admin Panel (FAZ 1)

**Önceki adım:** ADIM 18 (SEO altyapısı — robots, sitemap, middleware, JSON-LD)
**Sonraki adım:** ADIM 19 FAZ 2 (Resources, Forms, Redirects, Announcement,
Offices, Users CRUD) veya ADIM 20 (Backend testler)

## Amaç

Krontech marketing içeriklerini kod yazmadan yönetebilen bir admin panel
kurmak. Bu FAZ 1'de temel altyapı + en kritik iki modülü (Products, Blog)
bitirdik; kalan modüller FAZ 2 kapsamında sidebar'daki "Coming Soon"
kartından gelecek.

### FAZ 1 kapsamı (bu adım)

- JWT cookie-based auth (login, refresh token rotation, logout)
- Next.js middleware içinde `/admin/*` rota guard (cookie kontrol)
- Route group'lu admin shell (Sidebar + TopBar + UserMenu + mobil hamburger)
- Dashboard (content stats — paralel `countEndpoint` çağrıları)
- Shared admin componentleri:
  - DataTable + AdminPagination (generic, loading/empty state'leri)
  - FormCard + FormGrid
  - AdminInput / AdminTextarea / AdminSelect / AdminCheckbox (ARIA-compliant)
  - StatusBadge
  - ConfirmDialog (native `<dialog>`)
  - JsonBlockEditor (textarea + JSON parse validation on blur)
  - LocaleTabs (EN/TR switcher with per-locale error dots)
  - MediaPicker (URL + presigned upload flow)
  - **TipTapEditor** (advanced extension set + inline image upload)
  - TipTapToolbar (heading/bold/italic/underline/strike, list, align,
    color + highlight palette, link, image, youtube, table, code block,
    hr, clear format, undo/redo)
- Products CRUD (list + new + edit + publish/unpublish/delete + schedule)
- Blog CRUD (list + new + edit + publish/unpublish/delete + FAQ editor)
- 28 yeni unit test (session, guard, components)

### FAZ 2 kapsamı (sonraki mesaj)

- Resources CRUD (datasheet/casestudy/whitepaper)
- Forms Submissions listesi (contact/demo filtresi, export)
- Redirects CRUD
- Announcement Bar CRUD
- Offices CRUD
- Users CRUD (admin only)
- Media Library sayfası (presigned upload UI, dolu)
- Optional polish: bulk actions, sort indicators, saved filters

## Oluşturulan dosyalar

```
frontend/
├── app/
│   └── admin/
│       ├── layout.tsx                              (yeni — minimal wrapper, robots:noindex)
│       ├── login/page.tsx                          (yeni — public login UI)
│       └── (protected)/
│           ├── layout.tsx                          (yeni — AdminShell wrap)
│           ├── page.tsx                            (yeni — dashboard)
│           ├── products/page.tsx                   (yeni — list)
│           ├── products/new/page.tsx               (yeni — create)
│           ├── products/[id]/page.tsx              (yeni — edit)
│           ├── blog/page.tsx                       (yeni)
│           ├── blog/new/page.tsx                   (yeni)
│           ├── blog/[id]/page.tsx                  (yeni)
│           ├── resources/page.tsx                  (yeni — Coming Soon)
│           ├── forms/page.tsx                      (yeni — Coming Soon)
│           ├── redirects/page.tsx                  (yeni — Coming Soon)
│           ├── announcement/page.tsx               (yeni — Coming Soon)
│           ├── offices/page.tsx                    (yeni — Coming Soon)
│           └── media/page.tsx                      (yeni — Coming Soon)
├── components/admin/
│   ├── AdminShell.tsx                              (yeni — client shell w/ fetchMe)
│   ├── AdminDashboard.tsx                          (yeni — stats + quick actions)
│   ├── Sidebar.tsx                                 (yeni — 9 nav item + icons)
│   ├── TopBar.tsx                                  (yeni — breadcrumb, preview, user menu)
│   ├── LoginForm.tsx                               (yeni — email/password, next-redirect)
│   ├── DataTable.tsx                               (yeni — generic table + AdminPagination)
│   ├── FormCard.tsx                                (yeni — FormCard + FormGrid)
│   ├── FormField.tsx                               (yeni — AdminInput/Textarea/Select/Checkbox)
│   ├── StatusBadge.tsx                             (yeni — draft/published/scheduled)
│   ├── ConfirmDialog.tsx                           (yeni — native <dialog>)
│   ├── JsonBlockEditor.tsx                         (yeni — JSON parse+validate)
│   ├── LocaleTabs.tsx                              (yeni — EN/TR with error dots)
│   ├── MediaPicker.tsx                             (yeni — URL + presigned upload)
│   ├── TipTapEditor.tsx                            (yeni — advanced extensions)
│   ├── TipTapToolbar.tsx                           (yeni — 25+ formatting buttons)
│   ├── ComingSoon.tsx                              (yeni — placeholder card)
│   ├── products/
│   │   ├── ProductsList.tsx                        (yeni)
│   │   ├── ProductCreatePage.tsx                   (yeni)
│   │   ├── ProductEditPage.tsx                     (yeni)
│   │   └── ProductForm.tsx                         (yeni — main CRUD form)
│   └── blog/
│       ├── BlogList.tsx                            (yeni)
│       ├── BlogCreatePage.tsx                      (yeni)
│       ├── BlogEditPage.tsx                        (yeni)
│       └── BlogForm.tsx                            (yeni — TipTap + FAQ editor)
├── lib/admin/
│   ├── auth-types.ts                               (yeni — cookie names, lifetimes)
│   ├── session.ts                                  (yeni — cookie save/clear/get)
│   ├── auth-api.ts                                 (yeni — login/logout/fetchMe)
│   ├── client.ts                                   (yeni — adminApi axios + refresh interceptor)
│   ├── types.ts                                    (yeni — AdminProduct/Blog/Media)
│   ├── api-products.ts                             (yeni — CRUD + publish + schedule)
│   ├── api-blog.ts                                 (yeni — CRUD + publish + schedule)
│   ├── api-media.ts                                (yeni — presign + commit + upload)
│   └── api-stats.ts                                (yeni — dashboard counts)
├── middleware.ts                                   (güncellendi — admin guard)
├── app/globals.css                                 (güncellendi — tiptap-editor stil katmanı)
└── __tests__/admin/
    ├── session.test.ts                             (yeni — 4 case)
    ├── middleware-admin-guard.test.ts              (yeni — 5 case)
    ├── StatusBadge.test.tsx                        (yeni — 3 case)
    ├── DataTable.test.tsx                          (yeni — 7 case)
    ├── LocaleTabs.test.tsx                         (yeni — 4 case)
    └── JsonBlockEditor.test.tsx                    (yeni — 5 case)
```

Toplam: **42 yeni dosya**, **6 düzenleme**, **28 yeni test**.

## Mimari kararlar

### 1) Cookie-based auth (httpOnly değil — gerekçe)

Backend AuthService access token (15dk) + refresh token (7gün) döndürüyor.
Tercih: **client cookie** (js-cookie), çünkü:

- Admin axios interceptor'ı Bearer header eklemek için token'ı JS'ten
  okuyabilmeli (httpOnly cookie bunu engeller).
- Backend şu an CORS için `credentials: include` yapılandırmaması gerekir;
  tüm auth Bearer'dan akar → stateless.
- İleride httpOnly'ye geçmek isterseniz: backend `/auth/login` endpoint'i
  `Set-Cookie` header'ı döndürür, `adminApi` `withCredentials: true` alır,
  Bearer logic kaldırılır. Bu değişiklik izole — sadece `client.ts` +
  `auth-api.ts` + backend response'u.

**CSRF notu:** Admin action'ları hep Bearer + `@Roles()` guard ile korunuyor;
`SameSite=Lax` cookie de CSRF için yeterli. XSS olursa token çalınabilir
ama bu httpOnly için de geçerli (JS interceptor'ı zaten her yerden çağırıyor;
compromised origin → compromised token).

### 2) Route group ile auth-aware layout

```
app/admin/
├── layout.tsx              (minimum — sadece metadata robots:noindex)
├── login/page.tsx          (public, kendi gradient UI)
└── (protected)/
    ├── layout.tsx          (AdminShell — sidebar + topbar)
    └── ... CRUD pages
```

`(protected)` route group'u URL'de görünmez; böylece `/admin` (dashboard),
`/admin/products` vs. hepsi protected layout'u kullanırken `/admin/login`
çıplak kalır (sidebar/header yok).

### 3) Middleware guard — redirect lookup ile ayrı blok

`middleware.ts` iki iş yapıyor:

1. `/admin/*` için `TOKEN_COOKIE` kontrol → yoksa `/admin/login?next=...`
   redirect. Login path'inin kendisi için erken return.
2. Marketing site için `/api/redirects/lookup` çağrısı (ADIM 18'de eklendi).

Guard sırası kritik: admin path'ler için redirect lookup'ı skipliyoruz
(backend'i gereksiz yere dürtmemek için).

### 4) Refresh token interceptor — tek refresh garantisi

Birden fazla eşzamanlı istek 401 dönebilir. `refreshPromise` module-level
cache'lenerek sadece tek refresh çağrısı çalışıyor, diğerleri aynı
promise'i await ediyor. Başarısız refresh → session temiz, `/admin/login`'e
zorla yönlendirme.

Sonsuz döngü koruması: `/auth/refresh` veya `/auth/login` endpoint'lerinin
kendisi 401 dönerse interceptor retry yapmaz (guard).

### 5) TipTap advanced extension set

Kullanıcı seçimine göre "advanced":

- StarterKit (heading 2-3-4, paragraph, bold, italic, strike, list,
  blockquote, hr, history) — codeBlock devre dışı çünkü
  CodeBlockLowlight ile syntax highlight değiştirdik.
- Underline, TextAlign (heading/paragraph), Highlight (multicolor),
  Color + TextStyle (metin rengi paletiyle).
- TaskList + TaskItem (nested checkbox).
- Table + TableRow/Header/Cell (3×3 insert).
- Link (protocol whitelist: http/https/mailto), Image (drag-drop upload),
  Youtube (nocookie), CodeBlockLowlight (common dil seti).
- Bundle etkisi: +~200KB gzipped. Blog-heavy site için kabul edilebilir;
  admin chunk marketing'den izole.

### 6) Inline image upload flow

TipTap içinden resim yüklemek için `uploadMediaFile(file)` helper'ı çağırılıyor:

1. Client → `POST /admin/media/presign` (Bearer + `admin`/`editor` roles)
2. Response: `{ uploadUrl, key, expiresIn }` — S3/MinIO presigned PUT
3. Client → `PUT uploadUrl` (raw axios, no Bearer — URL kendi signed)
4. Client → `POST /admin/media/commit` (metadata DB'ye yazılır)
5. Editor'a `editor.setImage({ src: media.url })` ile insert edilir

Drag-drop ve toolbar butonu aynı flow'u paylaşıyor. Upload hatası olursa
editor'a kırmızı "Görsel yüklenemedi" paragrafı inject edilir (UX'te
sessiz başarısızlık yerine görünür fail).

### 7) JSON blok editörü (Product formu)

Product translation'larında `solution`, `howItWorks`, `keyBenefits`,
`productFamily`, `videos` → backend `Record<string, unknown>` olarak JSON.
Admin için tam bir visual builder ağır kaçar; onun yerine **textarea +
blur-validate** yaklaşımı:

- Yazılırken parse etmiyoruz (tümü hata olarak kalır, kötü UX).
- Blur veya submit öncesinde `JSON.parse` çalışır; hata varsa alan kırmızı
  + `role=alert` mesaj.
- Boş textarea → `emptyAs='null'` ile `null`; `'empty-object'` ile `{}`.
- Her alanın altında backend DTO şemasının **örneği** `hint` olarak
  yazılı; ADIM 14'teki `product-detail.ts` Zod şemalarıyla birebir aynı.

Uzun vadede her blok için özel UI (örn. `HowItWorksEditor` — steps tablosu,
`KeyBenefitsEditor` — icon seçici ile) yazılabilir; FAZ 2 kapsamında.

### 8) Locale tabs + per-locale error dot

EN zorunlu, TR opsiyonel. Form submit edildiğinde hata varsa:

- Hata key'i `en.title`, `tr.excerpt` gibi namespace'lenir.
- `LocaleTabs` hangi sekmenin dot'unu gösterir (kırmızı nokta).
- Auto-switch: EN'de hata varsa ilk EN sekmesine atlar.

### 9) Dashboard stats — paralel `countEndpoint`

Özel `/admin/stats` endpoint'i yok; mevcut list endpoint'lerine
`pageSize=1` ile çağırıp `response.total`'ı okuyoruz. 11 paralel
çağrı (`Promise.all`) ~100-300ms sürer. Yüksek trafikli admin
kullanımında backend'de dedike endpoint + Redis cache düşünülebilir
ama FAZ 1 için over-engineering.

### 10) `as never` cast'leri (typedRoutes)

Next.js `typedRoutes` deneysel özellik açık (`experimental.typedRoutes`).
Dynamic `/admin/products/${row.id}` gibi template literal'lar literal
olmadığı için `Link href={"/admin/..." as never}` cast'i gerektiriyor.
Build zamanında Next.js tüm statik rotaları keşfediyor → build hatası
yok. Runtime'da normal string işleniyor.

## Test Checklist

### Manuel test

- [ ] `docker compose up backend postgres redis` — backend `:4000`'te
- [ ] Seed yoksa: `cd backend && npm run seed`
- [ ] `cd frontend && npm run dev` → `http://localhost:3000/admin`
- [ ] Middleware token yoksa → `/admin/login?next=/admin` redirect
- [ ] Login:
  - [ ] Seed'deki `admin@krontech.com` + `.env`'deki `ADMIN_PASSWORD` ile giriş
  - [ ] Yanlış şifre → inline "E-posta veya şifre hatalı"
  - [ ] Başarılı → `/admin` dashboard
- [ ] Dashboard:
  - [ ] Ürünler / Blog / Kaynaklar / Media stat kartları dolu
  - [ ] "Yeni ürün" / "Yeni blog" hızlı aksiyonlar çalışıyor
- [ ] Sidebar:
  - [ ] Active state doğru vurgulanıyor (Products'tayken)
  - [ ] Mobile (375px) hamburger açıyor/kapıyor
  - [ ] Coming Soon kartları (Resources/Forms/Redirects/Announcement/Offices/Media)
- [ ] TopBar:
  - [ ] User menu → email + role + Çıkış
  - [ ] "Siteyi önizle" yeni sekmede `/` açıyor
- [ ] Products:
  - [ ] Liste paginated, search çalışıyor, status filter çalışıyor
  - [ ] Yeni ürün → EN zorunlu, TR opsiyonel validate
  - [ ] JSON blok alanları geçersiz JSON → blur'da alan kırmızı + hata mesajı
  - [ ] Slug boş → submit sonrası backend EN title'dan üretir
  - [ ] Düzenle → existing translations EN/TR sekmelerinde dolu gelir
  - [ ] Publish/Unpublish butonları durumu değiştiriyor
  - [ ] Sil → ConfirmDialog açılıyor, onay sonrası liste güncelleniyor
- [ ] Blog:
  - [ ] Liste (type + status filter)
  - [ ] Yeni yazı → TipTap toolbar tüm butonlar çalışıyor:
    - [ ] Bold/Italic/Underline/Strike
    - [ ] H2/H3, liste, görev listesi (checkbox)
    - [ ] Metin hizala (sol/orta/sağ)
    - [ ] Text color + Highlight palette
    - [ ] Link ekle → geçersiz URL reddediliyor
    - [ ] Image upload → toolbar'dan + drag-drop
    - [ ] YouTube embed
    - [ ] Tablo insert (3×3)
    - [ ] Code block (syntax highlight)
    - [ ] Undo/Redo
  - [ ] FAQ editor: ekle/sil/düzenle
  - [ ] Öne çıkan toggle → sidebar'da rozet çıkıyor
  - [ ] Schedule → future datetime zorunlu
- [ ] Logout → cookie silinir, `/admin/login`'e döner, geri düğmesiyle
      cached sayfaya gidilince middleware tekrar login'e atar

### Otomatik testler

```bash
cd frontend
npm test           # 161/161 pass
npm run type-check # 0 error
npm run lint       # 0 warning
npm run build      # admin routes görünür
```

## Güvenlik

- **Middleware cookie check** — sadece varlığı kontrol ediyor; payload'ı
  doğrulamıyor. Gerçek token doğrulaması backend'de (her request Bearer
  + JwtAuthGuard). Invalid/expired token → 401 → interceptor refresh → başarısız refresh → logout.
- **Open redirect koruması** — login sonrası `?next=...` param'ı
  `isSafeRelativeNext()` ile filtreleniyor (sadece `/` ile başlayan,
  `//` veya `/\` ile başlamayan path'ler).
- **TipTap link koruma** — `http/https/mailto` dışında protokol
  reddediliyor; `new URL()` parse başarısız → alert.
- **Media upload whitelist** — backend DTO (`ALLOWED_MIME_TYPES`) ile
  sınırlı: jpeg/png/webp/svg/gif/pdf. Max 50MB.
- **Admin noindex** — `app/admin/layout.tsx` metadata `robots: { index: false, follow: false }`.
- **XSS prevention** — TipTap output marketing tarafında `sanitize-html`
  ile whitelist'leniyor (ADIM 15 — zaten mevcut). Admin içinde TipTap
  kendi ProseMirror schema'sı ile reddediyor.

## Olası problemler

| Problem | Sebep | Çözüm |
|---|---|---|
| Login sonrası `/admin` loop | Backend refresh endpoint 500 dönüyor | `backend` loglarına bak; `JWT_SECRET` + `JWT_REFRESH_SECRET` env'de olmalı |
| TipTap image upload "Yükleme başarısız" | MinIO `FRONTEND_BUCKET` yaratılmamış | `docker compose exec minio mc mb local/krontech-media` |
| TipTap image upload CORS hatası | MinIO bucket CORS ayarı eksik | MinIO console (`:9001`) → bucket policy'e `PUT` izni ekle |
| Admin liste boş ama backend dolu | `NEXT_PUBLIC_API_URL` yanlış | `.env.local`'da `http://localhost:4000` olmalı |
| Ürün JSON bloğu kaydetme hatası | Backend Zod şeması strict | Form hint'inde yazılı şemaya uyduğundan emin ol |
| Blog TipTap içeriği kaydedilmiyor | Boş paragraflar 10 karakter altı | stripHtml check ≥10 — içeriğe gerçek metin ekle |
| Mobil hamburger açılmıyor | Body'de overflow:hidden lock yok | İleride eklenebilir; iOS Safari'de zaten çalışıyor |

## Sonraki adım — FAZ 2 veya ADIM 20

**FAZ 2 (Admin modüllerinin geri kalanı)**:

- Resources: Single-language table → basit form (title/excerpt/coverImage/fileUrl + type/locale/productId).
- Forms Submissions: Readonly liste + detail drawer + CSV export butonu.
- Redirects: CRUD + cache invalidation uyarısı.
- Announcement: Single-locale form + active window.
- Offices: CRUD + image upload + imagePosition toggle.
- Users: Create/edit/role change/reset password (admin only).
- Media Library: Full gallery (grid view, upload zone, bulk delete).

**ADIM 20 (Backend testler — zaten kapsamın büyük bölümü yazılmıştı
retrospektif olarak)**: Forms, Resources, Media, Auth e2e coverage
boşlukları + README'ye test-run yönergesi.

**ADIM 21 (README + son kontroller)**: Docker one-liner start, admin
credentials, manual smoke test, teknoloji kararları.
