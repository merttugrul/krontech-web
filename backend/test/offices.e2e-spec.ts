import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Offices module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let editorToken: string;

  const validPayload = {
    city: 'Istanbul',
    email: 'info@kron.com.tr',
    phone: '+90 212 555 44 33',
    address: 'Maslak No:1 Sariyer Istanbul Türkiye',
  };

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

  describe('GET /api/offices (public)', () => {
    it('locale filter + order asc', async () => {
      await prisma.office.createMany({
        data: [
          { city: 'Ankara', locale: 'en', order: 2, email: 'a@k', phone: '1', address: 'addr' },
          { city: 'Istanbul', locale: 'en', order: 0, email: 'i@k', phone: '2', address: 'addr' },
          { city: 'TR-City', locale: 'tr', order: 0, email: 't@k', phone: '3', address: 'addr' },
        ],
      });

      const res = await request(app.getHttpServer()).get('/api/offices?locale=en').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].city).toBe('Istanbul');
      expect(res.body[1].city).toBe('Ankara');
    });

    it('boş locale → empty array', async () => {
      const res = await request(app.getHttpServer()).get('/api/offices?locale=tr').expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/admin/offices', () => {
    it('auth yok → 401', async () => {
      await request(app.getHttpServer()).post('/api/admin/offices').send(validPayload).expect(401);
    });

    it('editor → 201', async () => {
      const res = await authed(app, editorToken)
        .post('/api/admin/offices')
        .send(validPayload)
        .expect(201);

      expect(res.body.city).toBe('Istanbul');
      expect(res.body.imagePosition).toBe('right');
    });

    it('invalid email → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/offices')
        .send({ ...validPayload, email: 'bad-email' })
        .expect(400);
    });

    it('imagePosition enum dışı → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/offices')
        .send({ ...validPayload, imagePosition: 'top' })
        .expect(400);
    });

    it('audit kaydı oluşur', async () => {
      await authed(app, adminToken).post('/api/admin/offices').send(validPayload).expect(201);
      const audit = await prisma.auditLog.findFirst({
        where: { entityType: 'Office', action: 'create' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('PATCH /api/admin/offices/:id', () => {
    it('başarılı update + cache invalidate (public yeni değeri görür)', async () => {
      const office = await prisma.office.create({
        data: { ...validPayload, locale: 'en' },
      });

      // Cache'i ısıt
      await request(app.getHttpServer()).get('/api/offices?locale=en');

      await authed(app, editorToken)
        .patch(`/api/admin/offices/${office.id}`)
        .send({ city: 'Updated City' })
        .expect(200);

      const res = await request(app.getHttpServer()).get('/api/offices?locale=en').expect(200);

      expect(res.body[0].city).toBe('Updated City');
    });
  });

  describe('DELETE /api/admin/offices/:id', () => {
    it('editor → 403 (admin only)', async () => {
      const office = await prisma.office.create({ data: validPayload });
      await authed(app, editorToken).delete(`/api/admin/offices/${office.id}`).expect(403);
    });

    it('admin → 200 + silinir', async () => {
      const office = await prisma.office.create({ data: validPayload });
      await authed(app, adminToken).delete(`/api/admin/offices/${office.id}`).expect(200);
      expect(await prisma.office.count()).toBe(0);
    });
  });

  describe('GET /api/admin/offices', () => {
    it('auth varsa locale dahil tüm ofisler', async () => {
      await prisma.office.createMany({
        data: [
          { ...validPayload, locale: 'en' },
          { ...validPayload, locale: 'tr', city: 'Ankara' },
        ],
      });

      const res = await authed(app, adminToken).get('/api/admin/offices').expect(200);
      expect(res.body).toHaveLength(2);
    });
  });
});
