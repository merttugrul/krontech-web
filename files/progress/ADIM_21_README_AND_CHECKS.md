# ADIM 21 — README ve son kontroller

## Yapılanlar

- Kök **`README.md`**: test komutları netleştirildi (unit vs e2e, Docker gereksinimi), health URL, yerel geliştirme akışı, smoke checklist, `files/progress` referansı.
- **`.env.example`**: reCAPTCHA açıklaması formlardaki **v3** kullanımı ile uyumlu hale getirildi.

## Smoke checklist (yayın öncesi)

1. `docker compose up -d` (veya tam stack) — portlar çakışmasın.
2. `cp .env.example .env` — üretimde tüm secret’lar değiştirilsin.
3. Backend: `GET http://localhost:4000/health` → 200.
4. Swagger: `http://localhost:4000/api/docs` açılıyor.
5. Site: ana sayfa + locale switch (EN/TR) + bir ürün/blog/kaynak sayfası.
6. Admin: `http://localhost:3000/admin` — giriş, dashboard, en az bir CRUD modülü (ör. blog) kaydet/sil.
7. Form: contact veya demo gönderimi (reCAPTCHA anahtarları tanımlıysa).
8. Testler: `backend` → `npm run test:unit`; e2e için Postgres container + `npm run test:e2e`. `frontend` → `npm test && npm run build`.

## İlerleme dokümanları

Aşama özetleri: `files/progress/ADIM_*.md` (ADIM 19 FAZ 1/2, ADIM 20 testler vb.).
