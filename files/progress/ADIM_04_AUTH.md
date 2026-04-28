# ADIM 4 — Auth Modülü (JWT)

> Krontech.com backend'inin kimlik doğrulama (authentication) ve yetkilendirme (authorization) altyapısını kurduk. JWT access/refresh token akışı, global guard'lar, role-based access control ve admin login endpoint'i hazır.

---

## 1. Hedefler

- ✅ JWT tabanlı kimlik doğrulama (access + refresh token)
- ✅ Şifre hash'leme (bcrypt, salt round 10)
- ✅ Global `JwtAuthGuard` — tüm endpoint'ler varsayılan olarak korunur
- ✅ `@Public()` decorator — public endpoint'leri işaretlemek için
- ✅ `RolesGuard` + `@Roles('admin' | 'editor')` — RBAC
- ✅ `@CurrentUser()` decorator — controller'da request.user'a erişim
- ✅ Refresh token endpoint'i (yeni access üretmek için)
- ✅ Login rate limiting (5 deneme / dakika) — brute-force koruması
- ✅ Swagger entegrasyonu (Bearer auth, response şemaları)
- ✅ Tüm endpoint'lerin canlı testi

---

## 2. Oluşturulan Dosyalar

### 2.1. Modül dosyaları

```
backend/src/modules/
├── users/
│   ├── users.module.ts          # UsersModule (export: UsersService)
│   └── users.service.ts         # CRUD + bcrypt + SafeUser tipi
└── auth/
    ├── auth.module.ts           # AuthModule (JwtModule.registerAsync + Passport)
    ├── auth.service.ts          # validateUser / login / refresh / token signing
    ├── auth.controller.ts       # POST /login, POST /refresh, GET /me
    ├── jwt.strategy.ts          # PassportStrategy<'jwt'> + payload validation
    └── dto/
        ├── login.dto.ts         # { email, password } + class-validator
        ├── refresh-token.dto.ts # { refreshToken: JWT }
        └── auth-response.dto.ts # AuthTokensDto + AuthUserDto + LoginResponseDto
```

### 2.2. Common (paylaşılan)

```
backend/src/common/
├── decorators/
│   ├── public.decorator.ts          # @Public() — JwtAuthGuard bypass
│   ├── roles.decorator.ts           # @Roles('admin', 'editor')
│   └── current-user.decorator.ts    # @CurrentUser() user
└── guards/
    ├── jwt-auth.guard.ts            # AuthGuard('jwt') + Public() override
    └── roles.guard.ts               # RolesGuard — request.user.role kontrolü
```

### 2.3. Güncellenen dosyalar

- `backend/src/app.module.ts` — `AuthModule`, `UsersModule` eklendi; `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard` global APP_GUARD olarak kaydedildi
- `backend/src/health.controller.ts` — `@Public()` eklendi (zorunlu, çünkü artık global JWT guard var)

---

## 3. Mimari Kararlar

### 3.1. Token stratejisi

| Token | Secret | Süre | Payload |
|-------|--------|------|---------|
| **Access** | `JWT_SECRET` | 15 dk | `{ sub, email, role, type: 'access' }` |
| **Refresh** | `JWT_REFRESH_SECRET` | 7 gün | `{ sub, type: 'refresh' }` |

- İki ayrı secret → access token sızdırılırsa bile refresh akışı güvende.
- `type` alanı access/refresh karışımını engelliyor (refresh endpoint'ine access token gönderilirse 401).
- Süreler `.env` ile özelleştirilebilir (`JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`).

### 3.2. "Default secure" — global guard

`JwtAuthGuard` global APP_GUARD olarak kayıtlı. **Tüm endpoint'ler varsayılan olarak token gerektirir.** Public yapmak için açıkça `@Public()` decorator'ı eklemek gerekir.

> Bu yaklaşım, "yanlışlıkla auth eklemeyi unutma" hatasını engeller. Yeni bir public endpoint eklerken bilinçli olarak işaretlemek zorundasın.

### 3.3. Rate limiting (brute-force koruması)

Login endpoint'i `@Throttle({ default: { limit: 5, ttl: 60_000 } })` ile korumalı: dakikada 5 deneme. Refresh için 10/dk. Health endpoint'i `@SkipThrottle()` ile muaf.

### 3.4. Şifre güvenliği

- `bcrypt` salt rounds = 10 (üretim için iyi denge)
- Hash'ler asla response'a sızmaz: `SafeUser` tipi `Omit<User, 'passwordHash'>` ile zorunlu kılındı
- `UsersService.findByEmailWithPassword()` sadece auth doğrulama için var, dışarıya açılmıyor

### 3.5. SafeUser pattern

```typescript
export type SafeUser = Omit<User, 'passwordHash'>;
```

`UsersService` ve `AuthService` controller'lara her zaman `SafeUser` döner. `passwordHash` tip seviyesinde elenir → unutkanlığa karşı garanti.

---

## 4. API Endpoint'leri

| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| `GET` | `/health` | Public | DB + Redis sağlık kontrolü |
| `POST` | `/api/auth/login` | Public | E-posta + şifre → tokenlar |
| `POST` | `/api/auth/refresh` | Public | Refresh token → yeni access |
| `GET` | `/api/auth/me` | Bearer | Şu anki kullanıcı bilgisi |

Swagger UI: **http://localhost:4000/api/docs** (Bearer auth aktif, "Authorize" butonu ile token gir → tüm korumalı endpoint'leri test edebilirsin.)

### Örnek login response

```json
{
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": 900
  },
  "user": {
    "id": "5c122101-7c93-4c53-a333-47050404edb7",
    "email": "admin@krontech.com",
    "role": "admin"
  }
}
```

---

## 5. Test Sonuçları

Backend'i `npm run start:dev` ile başlatıp 10 farklı senaryoyu test ettik. Hepsi beklenen davranışı verdi.

| # | Test | Beklenen | Gerçek | Sonuç |
|---|------|----------|--------|-------|
| 1 | `GET /health` (public) | 200 + status:ok | 200 + DB & Redis up | ✅ |
| 2 | `POST /login` (geçerli) | 200 + tokenlar | 200 + access (900s) + refresh + user | ✅ |
| 3 | `GET /me` (geçerli token) | 200 + user | 200 + admin@krontech.com (role: admin) | ✅ |
| 4 | `GET /me` (token yok) | 401 | 401 "Unauthorized" | ✅ |
| 5 | `GET /me` (geçersiz token) | 401 | 401 "Unauthorized" | ✅ |
| 6 | `POST /login` (yanlış şifre) | 401 | 401 "Invalid email or password" | ✅ |
| 7 | `POST /login` (olmayan user) | 401 | 401 "Invalid email or password" | ✅ |
| 8 | `POST /login` (5+ kez art arda) | 429 (rate limit) | 429 "Too Many Requests" | ✅ Bonus |
| 9 | `POST /refresh` (geçerli) | 200 + yeni tokenlar | 200 + access + refresh + expiresIn:900 | ✅ |
| 10 | `POST /refresh` (access token verilirse) | 401 | 401 "Invalid or expired refresh token" | ✅ |

### Önemli gözlemler

- **Test 7** (olmayan kullanıcı): Yanıt `"Invalid email or password"` — bilerek "user not found" demiyoruz, **enumeration attack** önlemek için.
- **Test 8** (rate limit): Spam'den korunmak için login dakikada 5'e sınırlı.
- **Test 10** (token type mismatch): Refresh endpoint'i sadece `type: 'refresh'` payload'lı tokenları kabul eder.
- Backend logları: `[NestApplication] Nest application successfully started` + `[Bootstrap] Krontech API running [development] on http://localhost:4000`.
- Tüm route'lar mapped: `/health`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`.

---

## 6. Sonraki Adımlarda Kullanım

Bu altyapı sayesinde diğer modüllerde (Products, Blog, Resources, Forms, vs.) çok az kodla auth ekleyebileceğiz:

```typescript
@Controller('products')
export class ProductsController {
  // Public read — herkes okuyabilir
  @Public()
  @Get()
  list() { /* ... */ }

  // Korumalı write — sadece admin/editor
  @Post()
  @Roles('admin', 'editor')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    // user.id audit log için, dto validated, sadece admin/editor erişebilir
  }

  // Sadece admin
  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) { /* ... */ }
}
```

---

## 7. Yapılan İyileştirmeler

1. **Default-secure architecture** — Global guard, opt-in public. Yanlışlıkla unutkanlığa karşı sıfır risk.
2. **Çift secret stratejisi** — Access ve refresh için ayrı `JWT_SECRET` / `JWT_REFRESH_SECRET`.
3. **Token type check** — Access/refresh karışımı imkansız (`type` alanı + ayrı secret).
4. **`SafeUser` tipi** — Şifre hash'ini tip seviyesinde eler, runtime'a bırakmaz.
5. **Brute-force koruması** — Login 5 req/dk, refresh 10 req/dk.
6. **Username enumeration koruması** — "Yanlış şifre" ve "kullanıcı yok" aynı mesajı döner.
7. **isActive kontrolü** — Pasif kullanıcılar hem login hem token validation'da reddedilir.
8. **Audit-ready** — `@CurrentUser()` ile her korumalı endpoint'te user.id'yi audit log için yakalayabiliyoruz.
9. **Swagger Bearer auth** — `/api/docs` üzerinden tüm endpoint'leri tek yerden test edilebilir hale geldi.

---

## 8. Test Komutları (manuel doğrulama)

```bash
cd backend && npm run start:dev

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@krontech.com","password":"Admin123!"}' \
  | jq -r '.tokens.accessToken')

# /me
curl -s http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

veya Swagger UI: http://localhost:4000/api/docs → "Authorize" → access token yapıştır → tüm endpoint'leri dene.

---

## 9. Durum

- ✅ TypeScript: 0 errors (`npx tsc --noEmit`)
- ✅ Build: başarılı (`npm run build`)
- ✅ Lint: 0 warnings (`npx eslint src/**/*.ts`)
- ✅ Runtime: backend ayağa kalkıyor, tüm modüller initialize oluyor
- ✅ DB connection: Prisma + PostgreSQL bağlantısı sağlam
- ✅ Redis connection: ioredis bağlantısı sağlam
- ✅ Auth flow: 10/10 test senaryosu beklenen davranışı verdi

**ADIM 4 tamamlandı. ADIM 5 (Products modülü) için hazırız.**
