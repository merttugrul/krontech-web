# ADIM 2 — NestJS Backend İskelet Kurulumu

**Durum:** Tamamlandı
**Süre:** ~25 dk (npm install dahil)
**Test edildi:** TypeScript strict, ESLint, NestJS build — hepsi 0 hata

---

## Amaç
NestJS uygulamasının temel iskeletini, TypeScript strict mode ve `any` yasağı ile kurmak. Tüm modül klasörlerinin hazır olması, böylece sıradaki adımlarda her modül doğru yere yerleşecek.

## Yaklaşım
NestJS CLI yerine manuel kurulum yapıldı. Sebep:
- Paket sürümlerini kontrol edebilmek
- TypeScript ayarlarını sıkı yapabilmek (`noUnusedLocals`, `noImplicitReturns` vb.)
- ESLint kurallarını baştan zorlayabilmek (`no-explicit-any: error`)

## Oluşturulan Dosyalar

### Konfigürasyon
| Dosya | Açıklama |
|---|---|
| `package.json` | 920 paket, scripts (build, dev, test, prisma) |
| `tsconfig.json` | strict mode + extras |
| `tsconfig.build.json` | build için exclude'lar |
| `nest-cli.json` | NestJS CLI config |
| `.eslintrc.js` | `no-explicit-any: 'error'` |
| `.prettierrc` | 100 char, tek tırnak, trailing comma |
| `.dockerignore` | node_modules, dist vb. |
| `Dockerfile` | Multi-stage (deps + development), hot-reload destekli |

### Kaynak Kod (`src/`)
| Dosya | Görev |
|---|---|
| `main.ts` | Bootstrap: Swagger, CORS, ValidationPipe, global filter, prefix `/api` |
| `app.module.ts` | Root module: ConfigModule (validate'li), ScheduleModule, ThrottlerModule, PrismaModule, RedisModule |
| `health.controller.ts` | `GET /health` — DB ve Redis ping |
| `config/env.validation.ts` | class-validator ile env doğrulama (eksik env varsa container patlar) |
| `prisma/prisma.service.ts` | Prisma client lifecycle (connect/disconnect log) |
| `prisma/prisma.module.ts` | Global module, her yere inject edilebilir |
| `redis/redis.service.ts` | get/set/del + `delPattern` (cache invalidation için kritik) |
| `redis/redis.module.ts` | ioredis factory (logger ile) |
| `common/filters/http-exception.filter.ts` | Tek tip JSON error response |

### Boş Klasörler (Sonraki Adımlarda Dolacak)
```
src/modules/{auth,users,products,blog,resources,media,forms,redirects,announcement,offices}/
src/common/{guards,decorators,interceptors,dto}/
```

## Plan'a Eklenen İyileştirmeler

| # | Madde | Sebep |
|---|---|---|
| 1 | **`/health` endpoint** | Docker healthcheck ve monitoring. Hem DB hem Redis'i doğruluyor. |
| 2 | **`@nestjs/schedule` baştan dahil** | ADIM 9'daki "scheduled publish" cron için. Plan analizinde tespit ettiğim eksiklik. |
| 3 | **`env.validation.ts`** | Container ayağa kalkarken yanlış env varsa anlamlı hata mesajıyla patlar. |
| 4 | **`HttpExceptionFilter`** | Tüm hatalar `{statusCode, timestamp, path, method, message}` formatında. Client tarafı tek format ile çalışır. |
| 5 | **`RedisService.delPattern()`** | `products:*` gibi pattern bazlı silme (SCAN ile). Plan'da bahsediliyordu ama metod tanımı eksikti. |
| 6 | **`tsconfig`'te `noUnusedLocals`, `noImplicitReturns`** | Plan'daki "any kullanma"dan öteye geçiyor. |
| 7 | **ESLint `no-explicit-any: 'error'`** | Build'i bile durdurur. |
| 8 | **Swagger `addBearerAuth` + `persistAuthorization`** | Geliştirici Swagger UI'da bir kez login olunca tüm endpoint'lerde token kalıcı. |
| 9 | **Multi-stage Dockerfile** | `deps` aşaması ayrı, build cache verimli. Dev'de `prisma migrate deploy` otomatik. |
| 10 | **Throttler global** (60 req/dk) | Plan'daki "rate limiting" gereksinimi karşılandı. |

## Klasör Yapısı (Tam)
```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── env.validation.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── redis/
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   ├── common/
│   │   ├── filters/http-exception.filter.ts
│   │   ├── guards/         (boş)
│   │   ├── decorators/     (boş)
│   │   ├── interceptors/   (boş)
│   │   └── dto/            (boş)
│   └── modules/
│       └── {auth, users, products, blog, resources, media, forms, redirects, announcement, offices}/  (boş)
├── prisma/
│   └── schema.prisma       (placeholder)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
├── .dockerignore
└── Dockerfile
```

## Karşılaşılan Sorunlar

### 1. `working_directory` parametresi shell tool'da çalışmadı
**Belirti:** İlk `npm install` denemesinde `working_directory: "backend"` versek de shell parent klasörde kalıyor, `package.json` bulamıyor.
**Çözüm:** `cd "/Users/.../backend" && npm install` ile explicit cd yaptık. Boşluklu path nedenliydi.

### 2. npm warning'leri
24 vulnerability raporlandı (4 low, 11 moderate, 9 high) — hepsi indirect deps'te (NestJS ekosistemi). Production'a çıkmadan önce `npm audit fix` çalıştırılır. Şu an blocker değil.

## Test Sonuçları

| Test | Sonuç |
|---|---|
| `npm install --legacy-peer-deps` | 920 paket kuruldu, hata yok |
| `npx prisma generate` | Prisma Client v5.22.0 oluşturuldu |
| `npx tsc --noEmit` | **0 TypeScript hatası** |
| `npm run build` | NestJS build başarılı, `dist/` oluştu |
| `npx eslint "src/**/*.ts"` | **0 lint hatası** |

## Sonraki Adıma Bağlantı
- ADIM 3'te `prisma/schema.prisma` placeholder yerine 14 entity'lik tam schema gelecek.
- `prisma/seed.ts` ile admin user, kategoriler, örnek ürün/blog/ofis verisi oluşacak.
- `docker compose up` ile gerçek bir end-to-end test yapacağız.
