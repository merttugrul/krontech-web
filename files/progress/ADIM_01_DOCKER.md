# ADIM 1 — Docker Compose Kurulumu

**Durum:** Tamamlandı
**Süre:** ~10 dk
**Test edildi:** `docker compose config --quiet` ile syntax doğrulandı

---

## Amaç
Tüm projenin tek komutla (`docker compose up --build`) ayağa kalkabilmesi için iskelet kurulumu. Bu adım kod yazmıyor, ortamı hazırlıyor.

## Oluşturulan Dosyalar

| Dosya | Açıklama |
|---|---|
| `docker-compose.yml` | 6 servis (postgres, redis, minio, minio-init, backend, frontend) |
| `.env.example` | Tüm ortam değişkenleri şablonu (yorumlu, kategorilendirilmiş) |
| `.env` | `.env.example`'dan kopyalandı (gitignore'da) |
| `.gitignore` | OS, Node, Next, Prisma, IDE, log, env hepsi dahil |
| `README.md` | Kurulum, servis adresleri, mimari kararlar, geliştirme komutları |
| `backend/Dockerfile` | Placeholder (ADIM 2'de gerçek Dockerfile ile değişti) |
| `frontend/Dockerfile` | Placeholder (ADIM 10'da gerçek Dockerfile ile değişecek) |

## Servisler ve Portlar

| Servis | Image | Port | Healthcheck |
|---|---|---|---|
| postgres | `postgres:16-alpine` | 5432 | `pg_isready` |
| redis | `redis:7-alpine` | 6379 | `redis-cli ping` |
| minio | `minio/minio:latest` | 9000 (API), 9001 (Console) | `/minio/health/live` |
| minio-init | `minio/mc:latest` | — | bucket'ı oluşturup public izin verir |
| backend | custom (node:20-alpine) | 4000 | bağımlılıklar healthy olunca başlar |
| frontend | custom (node:20-alpine) | 3000 | backend'e bağımlı |

## Plan'a Eklenen İyileştirmeler

| # | Madde | Sebep |
|---|---|---|
| 1 | **Healthcheck'ler** (postgres, redis, minio) | Backend, postgres ayağa kalkmadan başlamayı dener ve crash olur. Bu sık karşılaşılan race condition sorunu. |
| 2 | **`depends_on: condition: service_healthy`** | Sadece `depends_on` zaman bazlı değil, gerçek sağlık durumuna göre bekleme. |
| 3 | **`minio-init` servisi** | MinIO ayağa kalkınca otomatik olarak `krontech-media` bucket'ı oluşturup public okuma izni veriyor. Manuel CLI adımına gerek yok. |
| 4 | **`postgres:16-alpine`** | Standart imaja göre ~80 MB daha küçük. |
| 5 | **`S3_PUBLIC_ENDPOINT`** env'i | Backend MinIO'ya container içi `http://minio:9000` ile erişir, ama frontend tarayıcıdan `http://localhost:9000` ile erişmeli. Bu fark medya URL'leri için kritik (ileride lazım olacak). |
| 6 | **`CORS_ORIGIN`, `PORT`, `S3_REGION`** | Configurable. Production'da CORS_ORIGIN değiştirilebilir. |

## Karşılaşılan Sorunlar
**Hiçbiri.** `docker compose config` syntax kontrolü ilk denemede geçti.

## Test Sonucu
```bash
$ docker compose config --quiet && echo "OK"
OK: docker-compose.yml geçerli
```

Gerçek `docker compose up` testi ADIM 3 sonunda yapılacak (Prisma migration ile birlikte anlamlı bir test cycle olur).

## Sonraki Adıma Bağlantı
- ADIM 2'de `backend/Dockerfile` placeholder'dan multi-stage gerçek Dockerfile'a dönüştü.
- ADIM 3'te `prisma migrate deploy` Dockerfile'da otomatik çalışıyor.
