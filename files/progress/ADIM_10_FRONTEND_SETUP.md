# ADIM 10 — Next.js Frontend Kurulumu

> Durum: ✅ **Tamamlandı** · Build/type-check/lint/test yeşil

## 🎯 Hedef

Gerçek ürün/blog/içerik sayfaları ADIM 12+ ile gelmeden önce, Next.js 14 App
Router üzerine oturan sağlam bir iskelet kurmak:

- TypeScript strict, typed routes, path alias (`@/*`).
- Tailwind + PostCSS (renk paleti ADIM 11'de eklenecek).
- React Query provider (client-side data fetch için).
- Axios instance + RSC `sfetch` helper (server-side + ISR tag/revalidate).
- Backend revalidation kontratını karşılayan `POST /api/revalidate` route.
- i18n routing — EN default root'ta, TR `/tr` altında.
- Production-grade Dockerfile (standalone output, non-root user).
- Jest + React Testing Library (ADIM 12+ component testleri için hazır).

## 📁 Oluşturulan Dosyalar

### Config
- `frontend/package.json` — Next 14.2.35, React 18.3.1, TS 5.7, deps kilidli.
- `frontend/tsconfig.json` — strict + `noUncheckedIndexedAccess` + `@/*` alias.
- `frontend/next.config.mjs` — `output: 'standalone'`, typedRoutes,
  remotePatterns (MinIO), güvenlik header'ları.
- `frontend/tailwind.config.ts` — iskelet; palette ADIM 11'de doldurulacak.
- `frontend/postcss.config.mjs`
- `frontend/.eslintrc.json` — next/core-web-vitals + next/typescript,
  `no-explicit-any: error`.
- `frontend/next-env.d.ts`
- `frontend/.gitignore`
- `frontend/.env.example` / `.env.local`

### App Router
- `app/layout.tsx` — Root layout; `Inter` font `next/font` üzerinden, Turkish
  subset (`latin-ext`), `metadataBase` + OG defaults.
- `app/providers.tsx` — `<QueryClientProvider>` wrapper.
  staleTime 60s / gcTime 5m / retry 1.
- `app/globals.css` — Tailwind directives + CSS custom properties.
- `app/page.tsx` — EN home placeholder (link to `/tr`, backend API docs).
- `app/tr/page.tsx` — TR home placeholder (link back to `/`).
- `app/api/revalidate/route.ts` — Backend hook endpoint.

### lib/
- `lib/api.ts` — `axios.create` instance + `sfetch<T>(path, opts)` RSC fetch
  wrapper + `getApiErrorMessage(err)` helper.
- `lib/types.ts` — Backend sözleşmesiyle eşleşen TS tipleri (Product, Blog,
  Resource, AnnouncementBar, Office, Forms, Redirect).
- `lib/utils.ts` — `getLocaleFromPath`, `localePrefix`, `formatDate`, `cn`,
  `truncate`.

### Test
- `frontend/jest.config.mjs` — Next.js preset (nextJest), jsdom env.
- `frontend/jest.setup.ts` — `@testing-library/jest-dom` matchers.
- `frontend/__tests__/utils.test.ts` — 9 case (locale parsing, date format,
  cn, truncate).

### Infrastructure
- `frontend/Dockerfile` — Multi-stage (deps → build → runner), non-root `nextjs`
  user, `output: 'standalone'` tabanlı runtime. Build-time `NEXT_PUBLIC_*` args.
- `frontend/README.md` — kurulum, klasör yapısı, env tablo, revalidation
  sözleşmesi dokümantasyonu, yol haritası.
- `docker-compose.yml` — `frontend` servisi: build.args (public env),
  runtime env (NODE_ENV=production, REVALIDATION_SECRET), bind-mount
  kaldırıldı (production-grade).

## 🔑 Mimari Kararlar

### Next.js 14 (React 18) vs 16 (React 19)
Paket `next@latest` şu an 16.2.4, ama PLAN.md ve CURSOR_PROMPTS.md açıkça
**Next.js 14** diyor. Ekosistem (shadcn, yaygın hook lib'leri) hâlâ 14'te daha
stabil; 16'nın yeni async params API'si ekstra refactor gerektirirdi. Pinned
`14.2.35` + `react@18.3.1`.

### i18n Routing Stratejisi — Dizin Bazlı, Segment Değil
`app/[locale]/page.tsx` dinamik segment yerine `app/page.tsx` (EN default) +
`app/tr/page.tsx` tercih edildi. Sebepler:
1. Default locale URL'inde prefix yok (`/products` EN, `/tr/products` TR).
   SEO için canonical URL standartı: *primary locale prefix-siz kalır*.
2. Slug çakışması middleware'ı (ADIM 15 / 18) daha basit — TR prefix'i kök
   kontrolü `startsWith('/tr')` yeterli.
3. Next.js experimental i18n sub-path routing limitasyonları (metadata
   inheritance bug'ları) bypass edilir.

### Revalidation Endpoint — 404 Masking
Backend yanlış secret yollarsa **401 değil 404** dönüyoruz. Sebep: endpoint'in
varlığını güvenlik scanner'larına ifşa etmemek. Ayrıca secret body'de yollanır
(query-string'te değil) — log'lanma riski minimize.

### Standalone Output + Docker
`next.config.mjs` içinde `output: 'standalone'` → build sonrası `.next/standalone/`
altında minimum Node.js bundle üretilir. Dockerfile bu bundle'ı non-root
user'a kopyalar; image boyutu ~180MB yerine ~50MB civarı. `public/` ve `static/`
ayrı COPY edilir (Next.js bu ikisini standalone'a taşımaz, bilinen quirk).

### Server-Side Fetch Helper (`sfetch`)
RSC tarafında axios instance Next.js'in ISR/tag cache'iyle konuşamaz. O yüzden
`sfetch<T>(path, { tags, revalidate })` yazdık — altta `fetch` + `next: {...}`.
Backend'den bir içerik güncellenince `revalidateTag('products')` çağrısı bu
endpoint'in cache'ini invalide eder — ADIM 9'daki sözleşmenin frontend ucu.

### React Query config
- `staleTime: 60s` — aynı query key için aktif browser içinde 60 sn refetch yok.
- `refetchOnWindowFocus: false` — admin panel dışında gereksiz ağ trafiği.
- `retry: 1` — network flake için 1 kez dene, sonra hata yüz.

### Secret Güvenliği (env katmanları)
- `NEXT_PUBLIC_*` → build-time'da bundle'a gömülür, tarayıcıya ifşa. Sadece
  public key'ler (API URL, site URL, reCAPTCHA site key).
- `REVALIDATION_SECRET` → **prefix yok**; sadece Node runtime'da, route
  handler içinde okunur.

## 🧪 Doğrulama Sonuçları

```
npm run type-check  → ✓ (0 error)
npm run lint        → ✓ No ESLint warnings or errors
npm test            → ✓ 9/9 passed
npm run build       → ✓ /, /tr static; /api/revalidate dynamic
                      First Load JS ~96kB (framework + react-query)
```

## ⚠️ Karşılaşılan Sorunlar

1. **Jest `setupFilesAfterEach` adı yanlış.** Doğrusu `setupFilesAfterEnv`
   (node_modules/jest-config/build/ValidConfig.js'ten doğrulandı).
2. **`next@latest` → v16.** CURSOR_PROMPTS v14 öngörüyor; explicit pin'ledik.
3. **npm install sırasında EPERM warnings** — sandbox izinleri, paket
   indirmeyi engellemedi.

## 🔗 Backend Entegrasyonu — Revalidation Sözleşmesi

Backend `RevalidationService` (ADIM 9) → POST `/api/revalidate` body:
```json
{
  "secret": "REVALIDATION_SECRET",
  "tags": ["products", "sitemap"],
  "paths": ["/en/products/widget-a", "/tr/products/widget-a"]
}
```
Frontend cevabı:
- `secret` eşleşmezse → `404 { ok: false, error: "not found" }`
- Body parse edilemezse → `400 { ok: false, error: "invalid json" }`
- tags+paths ikisi de boşsa → `400`
- Başarı → `200 { ok: true, revalidated: { tags, paths }, now: <ts> }`

Manuel test:
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"revalidationsecret_change_me","tags":["products"]}'
```

## 🎬 Manuel Deneme Checklist

```bash
cd frontend
cp .env.example .env.local   # veya default değerlerle bırak
npm install
npm run dev
# → http://localhost:3000     (EN home)
# → http://localhost:3000/tr  (TR home)
```

`build && start`:
```bash
npm run build && npm start
```

Docker:
```bash
docker compose up frontend  # port 3000
```

## 🚀 Sıradaki Adım

**ADIM 11 — Tailwind config + Krontech renk paleti.**
`tailwind.config.ts` içine:
- `colors.kron.navy/blue/accent/light/gray/dark`
- Heading highlight utility (`.hl-blue` — altı çizili mavi)
- Genişletilmiş typography (Inter için weight scale)
- Custom container / responsive breakpoints (standart sm/md/lg/xl + `2xl`)
