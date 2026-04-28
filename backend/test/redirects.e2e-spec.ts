import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Redirects module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    const users = await seedUsers(prisma);
    adminToken = (await login(app, users.admin.email, users.admin.password)).accessToken;
    editorToken = (await login(app, users.editor.email, users.editor.password)).accessToken;
  });

  describe('GET /api/redirects/lookup (public)', () => {
    it('eşleşen aktif redirect → {toPath, statusCode} döner', async () => {
      await prisma.redirect.create({
        data: { fromPath: '/old', toPath: '/new', statusCode: 301, isActive: true },
      });

      const res = await request(app.getHttpServer())
        .get('/api/redirects/lookup?from=/old')
        .expect(200);

      expect(res.body.redirect).toEqual({ toPath: '/new', statusCode: 301 });
    });

    it('eşleşme yok → null döner', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/redirects/lookup?from=/ghost')
        .expect(200);

      expect(res.body.redirect).toBeNull();
    });

    it('inactive redirect → null', async () => {
      await prisma.redirect.create({
        data: { fromPath: '/off', toPath: '/x', isActive: false },
      });
      const res = await request(app.getHttpServer())
        .get('/api/redirects/lookup?from=/off')
        .expect(200);
      expect(res.body.redirect).toBeNull();
    });

    it('trailing slash normalize edilir', async () => {
      await prisma.redirect.create({
        data: { fromPath: '/a', toPath: '/b', isActive: true },
      });

      const res = await request(app.getHttpServer())
        .get('/api/redirects/lookup?from=/a/')
        .expect(200);

      expect(res.body.redirect).toEqual({ toPath: '/b', statusCode: 301 });
    });
  });

  describe('POST /api/admin/redirects', () => {
    it('auth yok → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/redirects')
        .send({ fromPath: '/a', toPath: '/b' })
        .expect(401);
    });

    it('editor → 201 + oluşur', async () => {
      const res = await authed(app, editorToken)
        .post('/api/admin/redirects')
        .send({ fromPath: '/old-page', toPath: '/new-page' })
        .expect(201);

      expect(res.body.fromPath).toBe('/old-page');
      expect(res.body.statusCode).toBe(301);
    });

    it('invalid path (/ yok) → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/redirects')
        .send({ fromPath: 'no-slash', toPath: '/x' })
        .expect(400);
    });

    it('duplicate fromPath → 409', async () => {
      await prisma.redirect.create({
        data: { fromPath: '/dup', toPath: '/x', isActive: true },
      });
      await authed(app, adminToken)
        .post('/api/admin/redirects')
        .send({ fromPath: '/dup', toPath: '/y' })
        .expect(409);
    });

    it('self-loop (from=to) → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/redirects')
        .send({ fromPath: '/a', toPath: '/a' })
        .expect(400);
    });

    it('external toPath (https://) kabul edilir', async () => {
      const res = await authed(app, adminToken)
        .post('/api/admin/redirects')
        .send({ fromPath: '/docs', toPath: 'https://docs.example.com' })
        .expect(201);
      expect(res.body.toPath).toBe('https://docs.example.com');
    });
  });

  describe('PATCH /api/admin/redirects/:id', () => {
    it('isActive toggle', async () => {
      const r = await prisma.redirect.create({
        data: { fromPath: '/a', toPath: '/b', isActive: true },
      });

      const res = await authed(app, adminToken)
        .patch(`/api/admin/redirects/${r.id}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);

      // lookup negative cache kontrol
      const lookup = await request(app.getHttpServer())
        .get('/api/redirects/lookup?from=/a')
        .expect(200);
      expect(lookup.body.redirect).toBeNull();
    });

    it('olmayan id → 404', async () => {
      await authed(app, adminToken)
        .patch('/api/admin/redirects/00000000-0000-0000-0000-000000000000')
        .send({ isActive: false })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/redirects/:id', () => {
    it('editor → 403 (admin only)', async () => {
      const r = await prisma.redirect.create({
        data: { fromPath: '/x', toPath: '/y' },
      });
      await authed(app, editorToken).delete(`/api/admin/redirects/${r.id}`).expect(403);
    });

    it('admin → 200 + kayıt silinir', async () => {
      const r = await prisma.redirect.create({
        data: { fromPath: '/x', toPath: '/y' },
      });
      await authed(app, adminToken).delete(`/api/admin/redirects/${r.id}`).expect(200);

      expect(await prisma.redirect.count()).toBe(0);
    });
  });

  describe('GET /api/admin/redirects', () => {
    it('search filter (fromPath veya toPath)', async () => {
      await prisma.redirect.createMany({
        data: [
          { fromPath: '/urun-eski', toPath: '/urunler/yeni' },
          { fromPath: '/about', toPath: '/about-us' },
        ],
      });

      const res = await authed(app, adminToken).get('/api/admin/redirects?search=urun').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].fromPath).toContain('urun');
    });
  });
});
