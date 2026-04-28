import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedUsers, SeedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Users admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: SeedUsers;
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => {
    const { app: a } = await createTestApp();
    app = a;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await resetAll(prisma, app);
    users = await seedUsers(prisma);
    adminToken = (await login(app, users.admin.email, users.admin.password)).accessToken;
    editorToken = (await login(app, users.editor.email, users.editor.password)).accessToken;
  });

  describe('GET /api/admin/users', () => {
    it('token yok → 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/users').expect(401);
    });

    it('editor → 403 (admin gerekir)', async () => {
      const res = await authed(app, editorToken).get('/api/admin/users').expect(403);
      expect(res.body.message).toContain('admin');
    });

    it('admin → 200, listede passwordHash yok', async () => {
      const res = await authed(app, adminToken).get('/api/admin/users').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      for (const u of res.body) {
        expect(u).toMatchObject({ id: expect.any(String), email: expect.any(String) });
        expect(u).not.toHaveProperty('passwordHash');
        expect(['admin', 'editor']).toContain(u.role);
      }
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('admin → 200 + tek kayıt', async () => {
      const res = await authed(app, adminToken)
        .get(`/api/admin/users/${users.editor.id}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: users.editor.id,
        email: users.editor.email,
        role: 'editor',
        isActive: true,
      });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('olmayan id → 404', async () => {
      await authed(app, adminToken)
        .get('/api/admin/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /api/admin/users', () => {
    it('auth yok → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/users')
        .send({ email: 'new@test.local', password: 'NewUser123' })
        .expect(401);
    });

    it('editor → 403', async () => {
      await authed(app, editorToken)
        .post('/api/admin/users')
        .send({ email: 'x@test.local', password: 'ValidPass1' })
        .expect(403);
    });

    it('admin → 201 + şifre dönmez', async () => {
      const res = await authed(app, adminToken)
        .post('/api/admin/users')
        .send({ email: 'newadmin@test.local', password: 'ValidPass1', role: 'editor' })
        .expect(201);

      expect(res.body).toMatchObject({ email: 'newadmin@test.local', role: 'editor' });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('duplicate email → 409', async () => {
      await authed(app, adminToken)
        .post('/api/admin/users')
        .send({ email: users.editor.email, password: 'AnotherPw1' })
        .expect(409);
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it('editor → 403', async () => {
      await authed(app, editorToken)
        .patch(`/api/admin/users/${users.admin.id}`)
        .send({ isActive: false })
        .expect(403);
    });

    it('admin → 200, isActive güncellenir', async () => {
      const res = await authed(app, adminToken)
        .patch(`/api/admin/users/${users.editor.id}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);

      const inDb = await prisma.user.findUnique({ where: { id: users.editor.id } });
      expect(inDb?.isActive).toBe(false);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('kendi hesabını silmeye çalışınca → 403', async () => {
      const res = await authed(app, adminToken)
        .delete(`/api/admin/users/${users.admin.id}`)
        .expect(403);
      expect(res.body.message).toContain('Kendi');
    });

    it('başka kullanıcıyı sil → 200 + editor DB’den gider', async () => {
      await authed(app, adminToken).delete(`/api/admin/users/${users.editor.id}`).expect(200);

      const gone = await prisma.user.findUnique({ where: { id: users.editor.id } });
      expect(gone).toBeNull();
    });

    it('editor → 403', async () => {
      await authed(app, editorToken)
        .delete(`/api/admin/users/${users.admin.id}`)
        .expect(403);
    });
  });
});
