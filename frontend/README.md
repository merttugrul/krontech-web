# Krontech Frontend

Next.js 14 · App Router · TypeScript (strict) · Tailwind CSS · React Query.

## Kurulum

```bash
cp .env.example .env.local  # zaten varsa atlayın
npm install
npm run dev
```

Frontend `http://localhost:3000` üzerinde açılır. Backend'in `http://localhost:4000`'de çalışıyor olması beklenir (bkz. `../backend/README.md`).

## Klasör Yapısı

```
app/
├── layout.tsx              # Root layout (Inter font, QueryClientProvider)
├── page.tsx                # EN ana sayfa
├── tr/page.tsx             # TR ana sayfa (locale prefix ile)
├── api/
│   └── revalidate/         # POST /api/revalidate — backend hook
└── globals.css
components/                 # ADIM 12+ ile doldurulacak
lib/
├── api.ts                  # axios instance + sfetch() RSC helper
├── types.ts                # Backend sözleşmesiyle eşleşen TS tipleri
└── utils.ts                # locale, formatDate, cn, truncate
```

## Environment Değişkenleri

| Değişken | Public? | Kullanım |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✓ | Backend REST API base URL |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Kendi origin'imiz (OG meta, metadataBase) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | ✓ | reCAPTCHA v3 client key |
| `REVALIDATION_SECRET` | ✗ | Backend'in revalidate çağrısını doğrulamak için |

## Komutlar

```bash
npm run dev         # development server
npm run build       # production build (standalone)
npm run start       # production server (build sonrası)
npm run lint        # Next.js + ESLint
npm run type-check  # tsc --noEmit
npm test            # Jest (ADIM 12+ ile test case'leri gelecek)
```

## Backend ile Revalidation Sözleşmesi

Backend (`RevalidationService`) içerik yayınladığında şu çağrıyı atar:

```http
POST http://localhost:3000/api/revalidate
Content-Type: application/json

{
  "secret": "REVALIDATION_SECRET değeri",
  "tags": ["products", "sitemap"],
  "paths": ["/en/products/widget-a", "/tr/products/widget-a"]
}
```

Frontend:
- Secret eşleşmezse **404** (bot'a endpoint'i reveal etmemek için).
- `tags` için `revalidateTag`, `paths` için `revalidatePath` çağrılır.
- Hiçbiri yoksa 400.

## Docker

```bash
docker compose up frontend
```

Build-time public env değişkenleri `docker-compose.yml` içinde `build.args` ile, runtime secret'lar ise `environment` bloğunda gelir.

## Yol Haritası

Bu ADIM 10 iskeletidir. Sıradaki adımlar:

- **ADIM 11** — Tailwind Krontech renk paleti (`kron.navy`, `kron.blue`, `kron.accent`, …)
- **ADIM 12** — Layout componentleri (Navbar, Footer, AnnouncementBar)
- **ADIM 13** — Ana sayfa hero + ürün + blog blokları
- **ADIM 14** — Ürün detay sayfası (tab menü, testimonial)
- **ADIM 15** — Blog sayfaları + slug middleware
- **ADIM 16** — Kaynaklar
- **ADIM 17** — Contact form + reCAPTCHA
- **ADIM 18** — SEO (sitemap route, robots.txt, structured data, redirect middleware)
- **ADIM 19** — Admin panel + TipTap rich text
