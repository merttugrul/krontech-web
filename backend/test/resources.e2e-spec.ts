import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetDatabase, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Resources module (e2e)', () => {
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
    await resetDatabase(prisma);
    const users = await seedUsers(prisma);
    adminToken = (await login(app, users.admin.email, users.admin.password)).accessToken;
    editorToken = (await login(app, users.editor.email, users.editor.password)).accessToken;
  });

  async function seedResource(
    opts: {
      status?: 'draft' | 'published';
      locale?: 'en' | 'tr';
      type?: 'datasheet' | 'casestudy' | 'whitepaper';
      title?: string;
    } = {},
  ) {
    return prisma.resource.create({
      data: {
        type: opts.type ?? 'datasheet',
        fileUrl: 'https://files/x.pdf',
        locale: opts.locale ?? 'en',
        title: opts.title ?? 'Test Resource',
        status: opts.status ?? 'published',
      },
    });
  }

  describe('GET /api/resources (public)', () => {
    it('sadece published döner', async () => {
      await seedResource({ status: 'published', title: 'Pub' });
      await seedResource({ status: 'draft', title: 'Draft' });

      const res = await request(app.getHttpServer()).get('/api/resources').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].title).toBe('Pub');
    });

    it('locale filter → sadece matched locale', async () => {
      await seedResource({ locale: 'en', title: 'EN only' });
      await seedResource({ locale: 'tr', title: 'TR only' });

      const res = await request(app.getHttpServer()).get('/api/resources?locale=tr').expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].title).toBe('TR only');
    });

    it('type filter → sadece casestudy', async () => {
      await seedResource({ type: 'datasheet', title: 'DS' });
      await seedResource({ type: 'casestudy', title: 'CS' });

      const res = await request(app.getHttpServer())
        .get('/api/resources?type=casestudy')
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].title).toBe('CS');
    });
  });

  describe('GET /api/resources/:id (public)', () => {
    it('draft → 404', async () => {
      const r = await seedResource({ status: 'draft' });
      await request(app.getHttpServer()).get(`/api/resources/${r.id}`).expect(404);
    });

    it('locale mismatch → 404', async () => {
      const r = await seedResource({ locale: 'en' });
      await request(app.getHttpServer()).get(`/api/resources/${r.id}?locale=tr`).expect(404);
    });

    it('published + locale match → 200', async () => {
      const r = await seedResource({ locale: 'en', status: 'published' });
      const res = await request(app.getHttpServer())
        .get(`/api/resources/${r.id}?locale=en`)
        .expect(200);
      expect(res.body.id).toBe(r.id);
    });
  });

  describe('POST /api/admin/resources', () => {
    it('editor → 201 + resource oluşturur', async () => {
      const res = await authed(app, editorToken)
        .post('/api/admin/resources')
        .send({
          type: 'whitepaper',
          fileUrl: 'https://files/wp.pdf',
          locale: 'en',
          title: 'New Whitepaper',
          description: 'Whitepaper description',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Whitepaper');

      const audit = await prisma.auditLog.findFirst({
        where: { entityType: 'Resource', action: 'create' },
      });
      expect(audit).not.toBeNull();
    });

    it('auth yok → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/resources')
        .send({ type: 'datasheet', fileUrl: 'https://x', title: 'X' })
        .expect(401);
    });

    it('olmayan productId → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/resources')
        .send({
          type: 'datasheet',
          fileUrl: 'https://x.pdf',
          title: 'X',
          productId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(400);
    });

    it('status=scheduled → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/resources')
        .send({
          type: 'datasheet',
          fileUrl: 'https://x.pdf',
          title: 'X',
          status: 'scheduled',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/admin/resources/:id', () => {
    it('başarılı update + audit kaydı', async () => {
      const r = await seedResource({ title: 'Old Title' });

      const res = await authed(app, editorToken)
        .patch(`/api/admin/resources/${r.id}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(res.body.title).toBe('New Title');

      const audit = await prisma.auditLog.findFirst({
        where: { entityType: 'Resource', action: 'update' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('DELETE /api/admin/resources/:id', () => {
    it('editor → 403 (admin only)', async () => {
      const r = await seedResource();
      await authed(app, editorToken).delete(`/api/admin/resources/${r.id}`).expect(403);
    });

    it('admin → 200', async () => {
      const r = await seedResource();
      await authed(app, adminToken).delete(`/api/admin/resources/${r.id}`).expect(200);

      const count = await prisma.resource.count();
      expect(count).toBe(0);
    });
  });

  describe('GET /api/admin/resources', () => {
    it('draft dahil hepsi görünür (admin)', async () => {
      await seedResource({ status: 'published' });
      await seedResource({ status: 'draft' });

      const res = await authed(app, adminToken).get('/api/admin/resources').expect(200);

      expect(res.body.total).toBe(2);
    });

    it('status filter → sadece draft', async () => {
      await seedResource({ status: 'published' });
      await seedResource({ status: 'draft' });

      const res = await authed(app, adminToken)
        .get('/api/admin/resources?status=draft')
        .expect(200);

      expect(res.body.total).toBe(1);
    });
  });
});
