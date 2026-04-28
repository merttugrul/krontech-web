import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { authed, login } from './helpers/auth.helper';
import { resetDatabase, seedBlogPost, seedBlogPostEnOnly, seedUsers, SeedUsers } from './helpers/db.helper';

describe('Blog (e2e)', () => {
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
    it('GET /api/blog → published postları paginated döner', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id });

      const res = await request(app.getHttpServer()).get('/api/blog?locale=en').expect(200);

      expect(res.body).toMatchObject({
        total: 1,
        page: 1,
        pageSize: 12,
      });
      expect(res.body.items[0]).toMatchObject({
        slug: 'test-blog-post',
        title: 'Test Blog Post',
        type: 'blog',
      });
    });

    it('GET /api/blog?locale=tr → TR translation döner', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id });

      const res = await request(app.getHttpServer()).get('/api/blog?locale=tr').expect(200);

      expect(res.body.items[0].title).toBe('Test Blog Yazısı');
    });

    it('GET /api/blog?locale=tr — TR yoksa EN çeviri (fallback) döner', async () => {
      await seedBlogPostEnOnly(prisma, { authorId: users.admin.id, title: 'Fallback EN Title' });

      const res = await request(app.getHttpServer()).get('/api/blog?locale=tr').expect(200);

      expect(res.body.items[0].title).toBe('Fallback EN Title');
    });

    it('GET /api/blog?type=news → sadece news postları', async () => {
      await seedBlogPost(prisma, {
        authorId: users.admin.id,
        slug: 'regular-blog',
        type: 'blog',
      });
      await seedBlogPost(prisma, {
        authorId: users.admin.id,
        slug: 'breaking-news',
        type: 'news',
      });

      const res = await request(app.getHttpServer()).get('/api/blog?type=news').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].slug).toBe('breaking-news');
    });

    it('GET /api/blog?isHighlight=true → sadece öne çıkanlar', async () => {
      await seedBlogPost(prisma, {
        authorId: users.admin.id,
        slug: 'normal',
        isHighlight: false,
      });
      await seedBlogPost(prisma, {
        authorId: users.admin.id,
        slug: 'featured',
        isHighlight: true,
      });

      const res = await request(app.getHttpServer()).get('/api/blog?isHighlight=true').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].slug).toBe('featured');
    });

    it('GET /api/blog/:slug — published → 200 + detail', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id });

      const res = await request(app.getHttpServer())
        .get('/api/blog/test-blog-post?locale=en')
        .expect(200);

      expect(res.body).toMatchObject({
        slug: 'test-blog-post',
        title: 'Test Blog Post',
        content: '<p>English body</p>',
      });
    });

    it('GET /api/blog/:slug — draft → 404', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id, status: 'draft' });
      await request(app.getHttpServer()).get('/api/blog/test-blog-post?locale=en').expect(404);
    });

    it('GET /api/blog/:slug — scheduled → 404', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id, status: 'scheduled' });
      await request(app.getHttpServer()).get('/api/blog/test-blog-post?locale=en').expect(404);
    });

    it('GET /api/blog/:slug — olmayan slug → 404', async () => {
      await request(app.getHttpServer()).get('/api/blog/no-such-slug?locale=en').expect(404);
    });

    it('GET /api/blog/:slug — her başarılı çağrıda viewCount artar', async () => {
      const { id, slug } = await seedBlogPost(prisma, { authorId: users.admin.id });

      await request(app.getHttpServer()).get(`/api/blog/${slug}?locale=en`).expect(200);
      await request(app.getHttpServer()).get(`/api/blog/${slug}?locale=en`).expect(200);

      // fire-and-forget → kısa bir gecikme sonrası DB'de değer artmış olmalı
      await new Promise((r) => setTimeout(r, 100));

      const fresh = await prisma.blogPost.findUniqueOrThrow({ where: { id } });
      expect(fresh.viewCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ────────────────────────────────
  // ADMIN AUTH / RBAC
  // ────────────────────────────────
  describe('Admin auth & RBAC', () => {
    it('token yok → 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/blog').expect(401);
    });

    it('admin GET /api/admin/blog → 200 + paginated', async () => {
      await seedBlogPost(prisma, { authorId: users.admin.id });

      const res = await authed(app, adminToken).get('/api/admin/blog').expect(200);
      expect(res.body).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    });

    it("admin GET /api/admin/blog?status=all → 400 (enum 'all' yok; UI param göndermemeli)", async () => {
      await authed(app, adminToken).get('/api/admin/blog?status=all').expect(400);
    });

    it('editor DELETE /api/admin/blog/:id → 403 (admin-only)', async () => {
      const { id } = await seedBlogPost(prisma, { authorId: users.admin.id });

      await authed(app, editorToken).delete(`/api/admin/blog/${id}`).expect(403);
    });

    it('editor publish → 200 (admin+editor allowed)', async () => {
      const { id } = await seedBlogPost(prisma, {
        authorId: users.admin.id,
        status: 'draft',
      });

      await authed(app, editorToken).post(`/api/admin/blog/${id}/publish`).expect(200);
    });
  });

  // ────────────────────────────────
  // CREATE → UPDATE → PUBLISH → DELETE
  // ────────────────────────────────
  describe('Lifecycle', () => {
    it('draft oluştur → public listede görünmez', async () => {
      const res = await authed(app, adminToken)
        .post('/api/admin/blog')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'New Post Draft',
              excerpt: 'A long enough excerpt for validation.',
              content: '<p>body</p>',
            },
          ],
        })
        .expect(201);

      expect(res.body.slug).toBe('new-post-draft');
      expect(res.body.status).toBe('draft');
      expect(res.body.authorId).toBe(users.admin.id); // request sahibi default yazar

      const list = await request(app.getHttpServer()).get('/api/blog').expect(200);
      expect(list.body.total).toBe(0);
    });

    it('sadece TR ile create → 201, admin listesinde görünür, yayınla → /api/blog?locale=tr', async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/blog')
        .send({
          translations: [
            {
              locale: 'tr',
              title: 'Sadece Türkçe Blog',
              excerpt: 'Validasyon için yeterince uzun bir özet.',
              content: '<p>sadece tr body</p>',
            },
          ],
        })
        .expect(201);

      const { id, slug, status } = create.body;
      expect(status).toBe('draft');
      expect(slug).toBeTruthy();

      const adminList = await authed(app, adminToken).get('/api/admin/blog').expect(200);
      expect(adminList.body.items.some((p: { id: string }) => p.id === id)).toBe(true);

      await authed(app, adminToken).post(`/api/admin/blog/${id}/publish`).expect(200);

      const trList = await request(app.getHttpServer()).get('/api/blog?locale=tr').expect(200);
      expect(trList.body.items.some((p: { slug: string }) => p.slug === slug)).toBe(true);
    });

    it('POST /api/admin/blog/:id/translations — tek dil upsert', async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/blog')
        .send({
          translations: [
            {
              locale: 'tr',
              title: 'Önce sadece TR',
              excerpt: 'Validasyon için yeterince uzun bir özet.',
              content: '<p>Türkçe gövde metni on karakterden uzun olmalı.</p>',
            },
          ],
        })
        .expect(201);

      await authed(app, adminToken)
        .post(`/api/admin/blog/${create.body.id}/translations`)
        .send({
          locale: 'en',
          title: 'Then add English',
          excerpt: 'A long enough excerpt for validation.',
          content: '<p>en body</p>',
        })
        .expect(200);

      const detail = await authed(app, adminToken).get(`/api/admin/blog/${create.body.id}`).expect(200);
      expect(detail.body.translations.map((t: { locale: string }) => t.locale).sort()).toEqual([
        'en',
        'tr',
      ]);
    });

    it('aynı slug ile ikinci create → 409', async () => {
      const payload = {
        translations: [
          {
            locale: 'en',
            title: 'Duplicate Post',
            excerpt: 'A long enough excerpt for validation.',
            content: '<p>duplicate body</p>',
          },
        ],
      };
      await authed(app, adminToken).post('/api/admin/blog').send(payload).expect(201);
      await authed(app, adminToken).post('/api/admin/blog').send(payload).expect(409);
    });

    it('publish → public detail 200 → delete → 404', async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/blog')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'Lifecycle Post',
              excerpt: 'A long enough excerpt for validation.',
              content: '<p>lifecycle body</p>',
            },
          ],
        });
      const { id, slug } = create.body;

      await request(app.getHttpServer()).get(`/api/blog/${slug}`).expect(404);
      await authed(app, adminToken).post(`/api/admin/blog/${id}/publish`).expect(200);
      await request(app.getHttpServer()).get(`/api/blog/${slug}`).expect(200);
      await authed(app, adminToken).delete(`/api/admin/blog/${id}`).expect(200);
      await request(app.getHttpServer()).get(`/api/blog/${slug}`).expect(404);
    });

    it('PATCH → translation upsert + update audit (yeni versiyon)', async () => {
      const { id } = await seedBlogPost(prisma, {
        authorId: users.admin.id,
        status: 'published',
      });

      await authed(app, adminToken)
        .patch(`/api/admin/blog/${id}`)
        .send({
          translations: [
            {
              locale: 'en',
              title: 'Updated Title',
              excerpt: 'A long enough excerpt for validation.',
              content: '<p>updated</p>',
            },
          ],
        })
        .expect(200);

      const tr = await prisma.blogPostTranslation.findUniqueOrThrow({
        where: { blogPostId_locale: { blogPostId: id, locale: 'en' } },
      });
      expect(tr.title).toBe('Updated Title');

      const versions = await authed(app, adminToken)
        .get(`/api/admin/blog/${id}/versions`)
        .expect(200);
      expect(versions.body.length).toBeGreaterThanOrEqual(1);
    });

    it("FAQ items create + detail response'ta döner", async () => {
      const create = await authed(app, adminToken)
        .post('/api/admin/blog')
        .send({
          translations: [
            {
              locale: 'en',
              title: 'FAQ Post',
              excerpt: 'A long enough excerpt for validation.',
              content: '<p>body</p>',
              faqItems: [
                { question: 'What is PAM?', answer: 'Privileged Access Management.' },
                { question: 'Why use it?', answer: 'To secure privileged credentials.' },
              ],
            },
          ],
        });

      await authed(app, adminToken).post(`/api/admin/blog/${create.body.id}/publish`);

      const detail = await request(app.getHttpServer())
        .get(`/api/blog/${create.body.slug}`)
        .expect(200);

      expect(detail.body.faqItems).toHaveLength(2);
      expect(detail.body.faqItems[0].question).toBe('What is PAM?');
    });
  });

  // ────────────────────────────────
  // CACHE
  // ────────────────────────────────
  describe('Cache invalidation', () => {
    it('write sonrası blog:* cache key sayısı sıfıra iner', async () => {
      const { id } = await seedBlogPost(prisma, { authorId: users.admin.id });

      await request(app.getHttpServer()).get('/api/blog?locale=en');
      await request(app.getHttpServer()).get('/api/blog/test-blog-post?locale=en');

      const keysBefore = await redis.getClient().keys('blog:*');
      expect(keysBefore.length).toBeGreaterThan(0);

      await authed(app, adminToken)
        .patch(`/api/admin/blog/${id}`)
        .send({ coverImage: 'https://img.example/c.jpg' });

      const keysAfter = await redis.getClient().keys('blog:*');
      expect(keysAfter.length).toBe(0);
    });
  });
});
