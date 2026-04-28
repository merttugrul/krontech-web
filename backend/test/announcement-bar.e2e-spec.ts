import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('AnnouncementBar module (e2e)', () => {
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

  describe('GET /api/announcement-bar (public)', () => {
    it('aktif yok → {announcement: null}', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);
      expect(res.body.announcement).toBeNull();
    });

    it('aktif + tarih aralığında → kayıt döner', async () => {
      await prisma.announcementBar.create({
        data: {
          locale: 'en',
          text: 'Big news!',
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);

      expect(res.body.announcement.text).toBe('Big news!');
    });

    it('inactive → null', async () => {
      await prisma.announcementBar.create({
        data: { locale: 'en', text: 'Hidden', isActive: false },
      });

      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);

      expect(res.body.announcement).toBeNull();
    });

    it('endDate geçmiş → null', async () => {
      await prisma.announcementBar.create({
        data: {
          locale: 'en',
          text: 'Expired',
          isActive: true,
          endDate: new Date('2020-01-01'),
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);

      expect(res.body.announcement).toBeNull();
    });

    it('startDate gelecekte → null (henüz aktif değil)', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      await prisma.announcementBar.create({
        data: {
          locale: 'en',
          text: 'Future',
          isActive: true,
          startDate: future,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);

      expect(res.body.announcement).toBeNull();
    });

    it('locale filter', async () => {
      await prisma.announcementBar.create({
        data: { locale: 'tr', text: 'TR mesaj', isActive: true },
      });

      const en = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);
      expect(en.body.announcement).toBeNull();

      const tr = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=tr')
        .expect(200);
      expect(tr.body.announcement.text).toBe('TR mesaj');
    });
  });

  describe('POST /api/admin/announcement-bar', () => {
    it('editor → 201 + oluşur', async () => {
      const res = await authed(app, editorToken)
        .post('/api/admin/announcement-bar')
        .send({ text: 'Merhaba dünya' })
        .expect(201);

      expect(res.body.text).toBe('Merhaba dünya');
      expect(res.body.isActive).toBe(true);
    });

    it('startDate >= endDate → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/announcement-bar')
        .send({
          text: 'Invalid range',
          startDate: '2026-12-31T00:00:00Z',
          endDate: '2026-01-01T00:00:00Z',
        })
        .expect(400);
    });

    it('auth yok → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/announcement-bar')
        .send({ text: 'x' })
        .expect(401);
    });
  });

  describe('PATCH /api/admin/announcement-bar/:id', () => {
    it('başarılı update → cache invalidate (public endpoint güncel görür)', async () => {
      const bar = await prisma.announcementBar.create({
        data: { locale: 'en', text: 'Old', isActive: true },
      });

      // İlk public çağrı cache'i ısıtır
      await request(app.getHttpServer()).get('/api/announcement-bar?locale=en');

      await authed(app, adminToken)
        .patch(`/api/admin/announcement-bar/${bar.id}`)
        .send({ text: 'New' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/announcement-bar?locale=en')
        .expect(200);

      expect(res.body.announcement.text).toBe('New');
    });
  });

  describe('DELETE /api/admin/announcement-bar/:id', () => {
    it('editor → 403 (admin only)', async () => {
      const bar = await prisma.announcementBar.create({
        data: { locale: 'en', text: 'x', isActive: true },
      });
      await authed(app, editorToken).delete(`/api/admin/announcement-bar/${bar.id}`).expect(403);
    });

    it('admin → 200 + kayıt silinir', async () => {
      const bar = await prisma.announcementBar.create({
        data: { locale: 'en', text: 'x', isActive: true },
      });
      await authed(app, adminToken).delete(`/api/admin/announcement-bar/${bar.id}`).expect(200);

      expect(await prisma.announcementBar.count()).toBe(0);
    });
  });
});
