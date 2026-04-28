# ADIM 20 — Backend testler (Jest + Supertest)

## Mevcut yapı

| Komut | Açıklama |
|--------|-----------|
| `npm run test:unit` | Yalnızca unit testler (`src/**/*.spec.ts`) — DB gerekmez |
| `npm run test:e2e` | Supertest + gerçek PostgreSQL (`krontech_test`) + Redis db=1 |
| `npm test` | `test:unit` **ve** `test:e2e` ardışık |

E2E için: `docker compose up -d postgres redis` ve `krontech_postgres` container’ının çalışması gerekir. `test/setup-e2e.ts` test DB’yi oluşturur ve `prisma migrate deploy` uygular.

## Bu adımda eklenenler

### E2E: `test/users.e2e-spec.ts`

`admin/users` API’si (FAZ 2’de eklenen) için uçtan uca senaryolar:

- **GET** list / **GET** `:id` — yetki (401/403/200), `passwordHash` yok, 404
- **POST** — 401, 403 (editor), 201 (admin), 409 duplicate email
- **PATCH** — 403, `isActive` güncellemesi
- **DELETE** — kendini silme 403, başka kullanıcı silme 200, editor 403

### Unit: `users.service.spec.ts` genişletmesi

- `findAll` — listelerde hash yok
- `update` — şifre verilince hash; yokluk `NotFoundException`
- `delete` — başarı / `NotFoundException`

## Doğrulama

- `npm run test:unit` — 167 test (önceki: 161 + 6 yeni)
- `npm run test:e2e -- --testPathPattern=users.e2e-spec` — 14 test (Docker açıkken)

## Notlar

- Tüm e2e paketini koşturmak: `npm run test:e2e` (süre ve DB paylaşımı nedeniyle `--runInBand` kullanılır).
- CI’de e2e için Postgres servis adımı veya `docker compose` eşdeğeri tanımlanmalı; yalnızca unit çalıştırmak için `npm run test:unit` yeterlidir.
