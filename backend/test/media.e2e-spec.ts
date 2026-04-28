import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { S3Service } from '../src/common/s3/s3.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetDatabase, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Media module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let editorToken: string;

  // S3Service'i mock'luyoruz — gerçek MinIO'ya upload yapmayız.
  const s3Mock = {
    presignPut: jest.fn(),
    presignGet: jest.fn(),
    putObject: jest.fn(),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn(),
  };

  beforeAll(async () => {
    const { app: a } = await createTestApp({
      overrides: [{ provider: S3Service, useValue: s3Mock }],
    });
    app = a;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    s3Mock.deleteObject.mockResolvedValue(undefined);
    await resetDatabase(prisma);
    const users = await seedUsers(prisma);
    adminToken = (await login(app, users.admin.email, users.admin.password)).accessToken;
    editorToken = (await login(app, users.editor.email, users.editor.password)).accessToken;
  });

  describe('POST /api/admin/media/presign', () => {
    it('auth yok → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/media/presign')
        .send({ mimeType: 'image/png', originalName: 'a.png', size: 1000 })
        .expect(401);
    });

    it('editor rolü → 200 + uploadUrl döner', async () => {
      s3Mock.presignPut.mockResolvedValue({
        uploadUrl: 'https://fake-s3/upload?sig',
        key: 'media/2026/abc',
        publicUrl: 'https://fake-s3/public/abc',
        expiresIn: 300,
      });

      const res = await authed(app, editorToken)
        .post('/api/admin/media/presign')
        .send({ mimeType: 'image/png', originalName: 'a.png', size: 1000 })
        .expect(200);

      expect(res.body).toMatchObject({
        uploadUrl: expect.any(String),
        key: expect.any(String),
        publicUrl: expect.any(String),
      });
      expect(s3Mock.presignPut).toHaveBeenCalled();
    });

    it('desteklenmeyen MIME → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/media/presign')
        .send({ mimeType: 'text/html', originalName: 'evil.html', size: 100 })
        .expect(400);
    });

    it('boyut > 50MB → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/media/presign')
        .send({
          mimeType: 'image/png',
          originalName: 'huge.png',
          size: 60 * 1024 * 1024,
        })
        .expect(400);
    });
  });

  describe('POST /api/admin/media/commit', () => {
    it("metadata DB'ye yazılır + 201", async () => {
      s3Mock.getPublicUrl.mockReturnValue('https://fake-s3/public/abc');

      const res = await authed(app, adminToken)
        .post('/api/admin/media/commit')
        .send({
          key: 'media/2026/abc',
          originalName: 'a.png',
          mimeType: 'image/png',
          size: 1000,
          width: 800,
          height: 600,
          altText: 'alt text',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        filename: 'media/2026/abc',
        url: 'https://fake-s3/public/abc',
        originalName: 'a.png',
        mimeType: 'image/png',
      });
      expect(res.body.id).toBeDefined();

      const count = await prisma.media.count();
      expect(count).toBe(1);

      const audit = await prisma.auditLog.findFirst({
        where: { entityType: 'Media', action: 'create' },
      });
      expect(audit).not.toBeNull();
    });
  });

  describe('GET /api/admin/media', () => {
    it('list + pagination', async () => {
      s3Mock.getPublicUrl.mockReturnValue('https://fake-s3/public/x');

      for (let i = 0; i < 3; i++) {
        await prisma.media.create({
          data: {
            filename: `media/2026/f${i}`,
            originalName: `file${i}.png`,
            url: `https://fake-s3/public/f${i}`,
            mimeType: 'image/png',
            size: 100,
          },
        });
      }

      const res = await authed(app, editorToken)
        .get('/api/admin/media?pageSize=2&page=1')
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(3);
    });

    it('mimeType filter → sadece image/', async () => {
      await prisma.media.createMany({
        data: [
          {
            filename: 'a',
            originalName: 'a.png',
            url: 'u1',
            mimeType: 'image/png',
            size: 1,
          },
          {
            filename: 'b',
            originalName: 'b.pdf',
            url: 'u2',
            mimeType: 'application/pdf',
            size: 1,
          },
        ],
      });

      const res = await authed(app, adminToken).get('/api/admin/media?mimeType=image/').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].mimeType).toBe('image/png');
    });
  });

  describe('DELETE /api/admin/media/:id', () => {
    it('editor rolü → 403 (admin only)', async () => {
      const m = await prisma.media.create({
        data: {
          filename: 'x',
          originalName: 'x.png',
          url: 'u',
          mimeType: 'image/png',
          size: 1,
        },
      });
      await authed(app, editorToken).delete(`/api/admin/media/${m.id}`).expect(403);
    });

    it('admin → 200 + S3 silme çağrılır', async () => {
      const m = await prisma.media.create({
        data: {
          filename: 'media/2026/to-delete',
          originalName: 'x.png',
          url: 'u',
          mimeType: 'image/png',
          size: 1,
        },
      });

      await authed(app, adminToken).delete(`/api/admin/media/${m.id}`).expect(200);

      expect(s3Mock.deleteObject).toHaveBeenCalledWith('media/2026/to-delete');
      const count = await prisma.media.count();
      expect(count).toBe(0);
    });

    it('olmayan id → 404', async () => {
      await authed(app, adminToken)
        .delete('/api/admin/media/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /api/admin/media/:id/alt-text', () => {
    it('altText güncellenir', async () => {
      const m = await prisma.media.create({
        data: {
          filename: 'z',
          originalName: 'z.png',
          url: 'u',
          mimeType: 'image/png',
          size: 1,
        },
      });

      const res = await authed(app, editorToken)
        .patch(`/api/admin/media/${m.id}/alt-text`)
        .send({ altText: 'updated alt' })
        .expect(200);

      expect(res.body.altText).toBe('updated alt');
    });
  });
});
