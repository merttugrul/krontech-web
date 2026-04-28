import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { authed, login } from './helpers/auth.helper';
import { resetDatabase, seedBasicProduct, seedUsers, SeedUsers } from './helpers/db.helper';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let users: SeedUsers;
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await redis.getClient().flushdb();
    users = await seedUsers(prisma);
    const admin = await login(app, users.admin.email, users.admin.password);
    const editor = await login(app, users.editor.email, users.editor.password);
    adminToken = admin.accessToken;
    editorToken = editor.accessToken;
  });

  // ────────────────────────────────
  // PUBLIC
  // ────────────────────────────────
  describe('Public read endpoints', () => {
    it('GET /api/products → published ürünleri döner (locale EN)', async () => {
      await seedBasicProduct(prisma);

      const res = await request(app.getHttpServer()).get('/api/products?locale=en').expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        slug: 'test-product',
        title: 'Test Product',
      });
    });

    it('GET /api/products (locale=tr) → TR translation döner', async () => {
      await seedBasicProduct(prisma);

      const res = await request(app.getHttpServer()).get('/api/products?locale=tr').expect(200);

      expect(res.body[0].title).toBe('Test Ürünü');
    });

    it('GET /api/products/:slug — published ürün → 200', async () => {
      await seedBasicProduct(prisma);

      const res = await request(app.getHttpServer())
        .get('/api/products/test-product?locale=en')
        .expect(200);

      expect(res.body.slug).toBe('test-product');
    });

    it('GET /api/products/:slug — draft → 404', async () => {
      await seedBasicProduct(prisma, { status: 'draft' });

      await request(app.getHttpServer()).get('/api/products/test-product?locale=en').expect(404);
    });

    it('GET /api/products/:slug — scheduled → 404', async () => {
      await seedBasicProduct(prisma, { status: 'scheduled' });

      await request(app.getHttpServer()).get('/api/products/test-product?locale=en').expect(404);
    });

    it('GET /api/products/:slug — olmayan slug → 404', async () => {
      await request(app.getHttpServer()).get('/api/products/no-such-slug?locale=en').expect(404);
    });

    it('GET /api/product-categories (locale EN/TR) → uygun isimler', async () => {
      await seedBasicProduct(prisma);

      const en = await request(app.getHttpServer())
        .get('/api/product-categories?locale=en')
        .expect(200);
      expect(en.body[0].name).toBe('Test Category');

      const tr = await request(app.getHttpServer())
        .get('/api/product-categories?locale=tr')
        .expect(200);
      expect(tr.body[0].name).toBe('Test Kategori');
    });
  });

  // ────────────────────────────────
  // ADMIN AUTH
  // ────────────────────────────────
  describe('Admin auth & RBAC', () => {
    it('token yok → 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/products').expect(401);
    });

    it('admin GET → 200 + paginated shape', async () => {
      await seedBasicProduct(prisma);

      const res = await authed(app, adminToken).get('/api/admin/products').expect(200);

      expect(res.body).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 20,
      });
      expect(res.body.items).toHaveLength(1);
    });

    it('editor DELETE /api/admin/products/:id → 403 (admin-only)', async () => {
      const { productId } = await seedBasicProduct(prisma);

      await authed(app, editorToken).delete(`/api/admin/products/${productId}`).expect(403);
    });

    it('editor POST /api/admin/products/:id/publish → 200 (admin+editor allowed)', async () => {
      const { productId } = await seedBasicProduct(prisma, { status: 'draft' });

      await authed(app, editorToken).post(`/api/admin/products/${productId}/publish`).expect(200);
    });

    it('editor DELETE /api/admin/product-categories/:id → 403', async () => {
      const { categoryId, productId } = await seedBasicProduct(prisma);
      // Kategoride ürün olmasın diye önce ürünü sil
      await authed(app, adminToken).delete(`/api/admin/products/${productId}`);

      await authed(app, editorToken)
        .delete(`/api/admin/product-categories/${categoryId}`)
        .expect(403);
    });
  });

  // ────────────────────────────────
  // CREATE + PUBLISH + DELETE LIFECYCLE
  // ────────────────────────────────
  describe('Create → publish → delete', () => {
    it('draft ürün oluşturur (EN+TR) → public listede görünmez', async () => {
      const res = await authed(app, adminToken)
        .post('/api/admin/products')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'New Product',
              shortDescription: 'Long enough description here for validation.',
            },
            {
              locale: 'tr',
              title: 'Yeni Ürün',
              shortDescription: 'Validasyon için yeterince uzun açıklama.',
            },
          ],
        })
        .expect(201);

      expect(res.body.slug).toBe('new-product');
      expect(res.body.status).toBe('draft');

      const listRes = await request(app.getHttpServer()).get('/api/products').expect(200);
      expect(listRes.body).toHaveLength(0);
    });

    it('EN olmadan sadece TR ile create → 400', async () => {
      await authed(app, adminToken)
        .post('/api/admin/products')
        .send({
          translations: [
            {
              locale: 'tr',
              title: 'Sadece TR',
              shortDescription: 'EN yok, validator reddetmeli.',
            },
          ],
        })
        .expect(400);
    });

    it('aynı slug ile ikinci create → 409', async () => {
      const payload = {
        translations: [
          {
            locale: 'en',
            title: 'Duplicate',
            shortDescription: 'Long enough description here for validation.',
          },
        ],
      };

      await authed(app, adminToken).post('/api/admin/products').send(payload).expect(201);
      await authed(app, adminToken).post('/api/admin/products').send(payload).expect(409);
    });

    it('publish → public detail 200, sonra delete → detail 404', async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/products')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'Lifecycle',
              shortDescription: 'Long enough description here for validation.',
            },
          ],
        });

      const id = create.body.id;
      const slug = create.body.slug;

      // draft iken public 404
      await request(app.getHttpServer()).get(`/api/products/${slug}`).expect(404);

      // publish
      await authed(app, adminToken).post(`/api/admin/products/${id}/publish`).expect(200);

      // public detail 200
      await request(app.getHttpServer()).get(`/api/products/${slug}`).expect(200);

      // delete
      await authed(app, adminToken).delete(`/api/admin/products/${id}`).expect(200);

      // artık yok
      await request(app.getHttpServer()).get(`/api/products/${slug}`).expect(404);
    });

    it('versions endpoint → en az 1 snapshot (create sonrası)', async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/products')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'Versioned',
              shortDescription: 'Long enough description here for validation.',
            },
          ],
        });

      const versions = await authed(app, adminToken)
        .get(`/api/admin/products/${create.body.id}/versions`)
        .expect(200);

      expect(versions.body.length).toBeGreaterThanOrEqual(1);
      expect(versions.body[0].version).toBe(1);
    });
  });

  // ────────────────────────────────
  // CACHE
  // ────────────────────────────────
  describe('Cache behavior', () => {
    it('write sonrası products:* cache key sayısı sıfıra iner', async () => {
      await seedBasicProduct(prisma);

      // Cache'i ısıt
      await request(app.getHttpServer()).get('/api/products?locale=en');
      await request(app.getHttpServer()).get('/api/products/test-product?locale=en');

      const keysBefore = await redis.getClient().keys('products:*');
      expect(keysBefore.length).toBeGreaterThan(0);

      // Write (update → invalidate)
      const productId = (
        await prisma.product.findUniqueOrThrow({ where: { slug: 'test-product' } })
      ).id;
      await authed(app, adminToken).patch(`/api/admin/products/${productId}`).send({ order: 9 });

      const keysAfter = await redis.getClient().keys('products:*');
      expect(keysAfter.length).toBe(0);
    });
  });
});
