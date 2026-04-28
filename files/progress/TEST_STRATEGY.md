# Test Stratejisi — Her Adım İçin Checklist

> **Prensip:** Her modülü tamamladığımızda aynı adımda test ediyoruz. "Sonra test yazarız" yok.

---

## Test Piramidi (bu projedeki yorumu)

```
       ┌─────────────┐
       │   Manuel    │   Swagger UI / curl ile smoke test
       │  Smoke %10  │   (her deploy öncesi kullanıcı tarafından)
       ├─────────────┤
       │     E2E     │   Gerçek DB + gerçek Redis + HTTP katmanı
       │    %30      │   (controller → service → DB yolunu doğrular)
       ├─────────────┤
       │    Unit     │   Service'ler + utility'ler (Prisma/Redis mock)
       │    %60      │   (iş mantığı, branch'ler, edge case'ler)
       └─────────────┘
```

---

## Test Türleri Ne Kapsar?

| Katman | Sorumluluk | Örnek |
|---|---|---|
| **Unit** (`*.spec.ts`) | Pure business logic, conditional dallar | `validateUser` isActive=false dönüşü |
| **E2E** (`*.e2e-spec.ts`) | Gerçek HTTP→DB pipeline, RBAC, cache invalidation | `POST /admin/products` editor→403 |
| **Manuel smoke** | Deploy sonrası canlı sanity check | Swagger'da login + product create |

**Kural:** Controller / guard / strategy gibi *framework wiring* kodları e2e ile test edilir. Service'ler unit + e2e ile (davranış teyidi + branch coverage).

---

## Her Yeni Adımda Testler

### 1. Unit testleri (her yeni service için)

**Dosya konumu:** `src/modules/<modül>/<servis>.spec.ts`

**Yazılması zorunlu case'ler:**

- [ ] Happy path (mutlu yol — tüm parametreler geçerli)
- [ ] Validation hataları (BadRequestException fırlatan her branch)
- [ ] Conflict durumları (ConflictException, unique constraint)
- [ ] NotFoundException case'leri
- [ ] Her branch koşulu (if/else) için en az 1 test
- [ ] Side-effect çağrıları (audit.record, cache.invalidate, vb.) `toHaveBeenCalled` ile

**Mocklar:**
- Prisma → her method için `jest.fn()`
- Redis → `getOrSet/invalidateNamespace` mock
- bcrypt → `jest.mock('bcrypt')` (module-level, spyOn değil)

### 2. E2E testleri (her yeni controller için)

**Dosya konumu:** `test/<modül>.e2e-spec.ts`

**Yazılması zorunlu case'ler (min. 10):**

- [ ] **Auth:** token yok → 401
- [ ] **Auth:** geçersiz token → 401
- [ ] **RBAC:** admin-only endpoint'e editor → 403
- [ ] **Public read:** yayında olan içerik → 200
- [ ] **Public read:** draft/scheduled → 404 (görünmez)
- [ ] **Admin create:** happy path → 201 + DB'de kayıt var
- [ ] **Admin create:** validation hatası → 400
- [ ] **Admin create:** duplicate (unique constraint) → 409
- [ ] **Admin update:** partial patch → 200
- [ ] **Lifecycle:** create → publish → public'de görünür → delete → public'de yok
- [ ] **Cache:** write sonrası cache key sıfıra iner
- [ ] **Versions:** write sonrası `/versions` endpoint snapshot döner

**Her `beforeEach`:**
```ts
await resetDatabase(prisma);      // truncate all tables
await redis.getClient().flushdb(); // clear cache
users = await seedUsers(prisma);   // admin + editor
```

### 3. Manuel smoke testleri (kullanıcı doğrulaması)

Her adım sonunda `files/progress/ADIM_XX_*.md` dosyasında **"Manuel Test Komutları"** bölümü olmalı:

- Swagger URL'leri
- Örnek curl komutları (admin login + feature kullanımı)
- Beklenen davranış açıklaması

---

## Çalıştırma Komutları

```bash
# Geliştirirken (hızlı):
npm run test:unit              # sadece unit, ~2sn
npm run test:unit:watch        # TDD modu

# Coverage:
npm run test:unit:cov          # threshold'lar jest.config.js'te

# Tam test:
npm run test:e2e               # gerçek DB + Redis gerektirir
npm test                       # unit + e2e birlikte

# DB ilk kurulum (test setup otomatik hallediyor ama manuel de yapılabilir):
docker exec krontech_postgres psql -U krontech -d postgres -c "CREATE DATABASE krontech_test"
```

## Ön Koşullar

- `docker compose up -d postgres redis` (Postgres **ve** Redis çalışıyor olmalı)
- `krontech_test` DB'yi setup-e2e.ts otomatik oluşturur

---

## Coverage Hedefleri

| Metrik | Threshold | Not |
|---|---|---|
| Statements | %50 | Unit scope (services + utils + common) |
| Branches | %40 | Read-path'ler e2e'de |
| Functions | %50 | Düşük tutma sebebi: read-only metodlar e2e'de |
| Lines | %50 | Aynı |

**Ayrıca:** E2E testleri kritik kullanıcı akışlarını (create→publish→delete, RBAC, cache) doğrular. Unit coverage düşüklüğünün sebebi *read-path* metodlarının gerçek DB ile test edilmesidir — bu zayıflık değil, bilinçli test piramidi tercihi.

---

## Mevcut Durum (ADIM 5 sonu)

```
Unit:  51 test  → 5 spec file  → %64 coverage  (~2sn)
E2E:   30 test  → 2 spec file  → gerçek DB+Redis (~2sn)
Total: 81 test  ✓ tümü yeşil    (~8sn)
```

**Spec dosyaları:**
- `src/modules/auth/auth.service.spec.ts` (16 case)
- `src/modules/users/users.service.spec.ts` (6 case)
- `src/modules/products/products.service.spec.ts` (15 case)
- `src/common/cache/cache.service.spec.ts` (8 case)
- `src/common/audit/audit.service.spec.ts` (6 case)
- `test/auth.e2e-spec.ts` (13 case)
- `test/products.e2e-spec.ts` (17 case)

---

## Sonraki Modüller İçin Checklist Template

ADIM 6 (Blog) ve sonrası için her yeni modülde şu **minimum** test seti yazılmalı:

### `<modül>.service.spec.ts` (Unit)

```
[ ] create: EN translation zorunlu validation
[ ] create: slug normalization (TR karakter)
[ ] create: duplicate slug → Conflict
[ ] create: başarılı → audit.record + audit.snapshot + cache invalidate
[ ] findBySlugPublic: draft → 404
[ ] findBySlugPublic: publishedAt gelecekte → 404
[ ] findBySlugPublic: translation yok → 404
[ ] publish: status=published + audit
[ ] delete: audit.record + cache invalidate
[ ] schedule: geçmiş tarih → BadRequest
[ ] listAdmin: pagination + search where clause
```

### `test/<modül>.e2e-spec.ts` (E2E)

```
[ ] GET /api/<modül> → 200 + published items only
[ ] GET /api/<modül>?locale=tr → TR translations
[ ] GET /api/<modül>/:slug — published → 200
[ ] GET /api/<modül>/:slug — draft → 404
[ ] Admin endpoint token yok → 401
[ ] Admin editor DELETE → 403 (eğer admin-only ise)
[ ] Admin create happy path → 201
[ ] Admin create validation hatası → 400
[ ] Admin create duplicate → 409
[ ] Lifecycle: create → publish → delete
[ ] Cache: write sonrası cache invalidate
[ ] Versions endpoint → snapshot var
```

Her adım tamamlandığında bu checklist'in hepsi yeşil olmadan bir sonraki adıma geçmiyoruz.
