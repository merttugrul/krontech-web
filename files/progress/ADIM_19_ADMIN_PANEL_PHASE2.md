# ADIM 19 — Admin Panel FAZ 2

## Özet

FAZ 1’de placeholder bırakılan modüller tamamlandı: **Kaynaklar**, **Form gönderileri**, **Redirects**, **Duyuru barı**, **Ofisler**, **Media Library** ve **Kullanıcılar** (yalnızca admin). Backend’de `UsersService` vardı ancak HTTP API yoktu; **`GET/POST/PATCH/DELETE /admin/users`** eklendi.

## Backend

- `modules/users/users.admin.controller.ts` — CRUD, `@Roles(Role.admin)`.
- `modules/users/dto/create-admin-user.dto.ts`, `update-admin-user.dto.ts`.
- `UsersModule` içine controller kaydı.
- Kendi hesabını silme: `403 Forbidden`.

## Frontend

- `lib/admin/api-resources.ts`, `api-forms.ts`, `api-redirects.ts`, `api-announcement.ts`, `api-offices.ts`, `api-users.ts`.
- `lib/admin/types.ts` — ilgili admin tipleri.
- `api-media.ts` — `updateMediaAltText`.
- Bileşenler: `components/admin/resources/*`, `forms/*`, `redirects/*`, `announcement/*`, `offices/*`, `media/MediaLibrary.tsx`, `users/*`.
- App Router: `resources`, `forms/[id]`, `redirects`, `announcement`, `offices`, `media`, `users` altında list/new/edit sayfaları.
- **Sidebar**: Admin rolünde **Kullanıcılar** linki; footer `FAZ 2`.
- Form gönderileri: sayfa başına **JSON export**; silme yalnızca **admin** (GDPR).
- Media: grid, yükleme, alt text düzenleme; **silme** butonu yalnızca admin (API ile uyumlu).

## Doğrulama

- `frontend`: `npm run build`, `npm test`.
- `backend`: `npm run build`.

## Notlar

- Kaynak **durumu**: API `scheduled` kabul etmez; formda yalnızca taslak / yayında.
- Editor rolü `/admin/users` sayfalarına giderse UI “erişim yok” gösterir; API zaten `403` döner.
