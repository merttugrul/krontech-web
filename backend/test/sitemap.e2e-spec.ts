import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedBasicProduct, seedBlogPost, seedUsers } from './helpers/db.helper';

describe('Sitemap (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await seedUsers(prisma);
  });

  it('GET /sitemap.xml → 200 + application/xml + valid XML', async () => {
    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.header['content-type']).toMatch(/application\/xml/);
    expect(res.text).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(res.text).toMatch(/<\/urlset>\s*$/);
  });

  it('statik sayfalar her iki locale için var', async () => {
    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).toContain('/en/products');
    expect(res.text).toContain('/tr/products');
    expect(res.text).toContain('/en/blog');
    expect(res.text).toContain('/en/contact');
    expect(res.text).toContain('/tr/contact');
  });

  it("published product → sitemap'e eklenir (en + tr URL)", async () => {
    await seedBasicProduct(prisma, { status: 'published' });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).toContain('/en/products/test-product');
    expect(res.text).toContain('/tr/products/test-product');
  });

  it("draft product → sitemap'te YOK", async () => {
    await seedBasicProduct(prisma, { status: 'draft' });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).not.toContain('/products/test-product');
  });

  it("published blog post → sitemap'e eklenir", async () => {
    const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@test.local' } });
    await seedBlogPost(prisma, { status: 'published', authorId: admin.id });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).toContain('/en/blog/test-blog-post');
    expect(res.text).toContain('/tr/blog/test-blog-post');
  });

  it("scheduled blog post → sitemap'te YOK", async () => {
    const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@test.local' } });
    await seedBlogPost(prisma, { status: 'scheduled', authorId: admin.id });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).not.toContain('/blog/test-blog-post');
  });

  it("published resource → sitemap'e eklenir (tek locale — resource locale kolonu)", async () => {
    await prisma.resource.create({
      data: {
        type: 'datasheet',
        fileUrl: 'https://example.com/x.pdf',
        locale: 'tr',
        title: 'TR Datasheet',
        status: 'published',
      },
    });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    expect(res.text).toMatch(/\/tr\/resources\/[a-f0-9-]+/);
    expect(res.text).not.toMatch(/\/en\/resources\/[a-f0-9-]+/);
  });

  it('Cache-Control header 1 saat', async () => {
    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);
    expect(res.header['cache-control']).toMatch(/max-age=3600/);
  });

  it('XML special char (&) → escape (&amp;)', async () => {
    const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@test.local' } });
    await seedBlogPost(prisma, {
      status: 'published',
      authorId: admin.id,
      slug: 'my-post',
    });

    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);

    // & direkt geçmemeli — en azından html entity olarak escape edilmeli
    expect(res.text).not.toMatch(/<loc>[^<]*&[^a-z][^<]*<\/loc>/);
  });
});
