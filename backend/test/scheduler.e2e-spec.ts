import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { SchedulerService } from '../src/common/scheduler/scheduler.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetAll, seedBasicProduct, seedBlogPost, seedUsers } from './helpers/db.helper';

describe('Scheduler (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scheduler: SchedulerService;
  let adminId: string;

  beforeAll(async () => {
    const { app: a } = await createTestApp();
    app = a;
    prisma = app.get(PrismaService);
    scheduler = app.get(SchedulerService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await resetAll(prisma, app);
    const users = await seedUsers(prisma);
    adminId = users.admin.id;
  });

  it('scheduledAt geçmişte + status=scheduled → published olur', async () => {
    const { productId } = await seedBasicProduct(prisma, { status: 'scheduled' });
    await prisma.product.update({
      where: { id: productId },
      data: { scheduledAt: new Date(Date.now() - 60_000) },
    });

    const result = await scheduler.publishScheduled();

    expect(result.productsPublished).toBe(1);
    expect(result.blogPostsPublished).toBe(0);

    const updated = await prisma.product.findUnique({ where: { id: productId } });
    expect(updated?.status).toBe('published');
    expect(updated?.publishedAt).toBeInstanceOf(Date);
    expect(updated?.scheduledAt).toBeNull();
  });

  it('scheduledAt gelecekte → henüz publish olmaz', async () => {
    const { productId } = await seedBasicProduct(prisma, { status: 'scheduled' });
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    await prisma.product.update({
      where: { id: productId },
      data: { scheduledAt: future },
    });

    const result = await scheduler.publishScheduled();

    expect(result.productsPublished).toBe(0);

    const still = await prisma.product.findUnique({ where: { id: productId } });
    expect(still?.status).toBe('scheduled');
    expect(still?.scheduledAt).toEqual(future);
  });

  it('blog post scheduled → published transition', async () => {
    const { id } = await seedBlogPost(prisma, { status: 'scheduled', authorId: adminId });
    await prisma.blogPost.update({
      where: { id },
      data: { scheduledAt: new Date(Date.now() - 30_000) },
    });

    const result = await scheduler.publishScheduled();

    expect(result.blogPostsPublished).toBe(1);

    const post = await prisma.blogPost.findUnique({ where: { id } });
    expect(post?.status).toBe('published');
    expect(post?.publishedAt).toBeInstanceOf(Date);
    expect(post?.scheduledAt).toBeNull();
  });

  it("aynı batch'te birden fazla kayıt → hepsi transition olur", async () => {
    const due = new Date(Date.now() - 10_000);
    const { productId: p1 } = await seedBasicProduct(prisma, { status: 'scheduled' });
    // İkinci product için farklı slug gerekli
    const p2 = await prisma.product.create({
      data: {
        slug: 'test-product-2',
        status: 'scheduled',
        scheduledAt: due,
        translations: {
          create: [
            {
              locale: 'en',
              title: 'P2',
              shortDescription: 'Long enough second product desc.',
            },
          ],
        },
      },
    });
    await prisma.product.update({
      where: { id: p1 },
      data: { scheduledAt: due },
    });

    const { id: b1 } = await seedBlogPost(prisma, {
      status: 'scheduled',
      authorId: adminId,
    });
    await prisma.blogPost.update({
      where: { id: b1 },
      data: { scheduledAt: due },
    });

    const result = await scheduler.publishScheduled();

    expect(result.productsPublished).toBe(2);
    expect(result.blogPostsPublished).toBe(1);
    expect(result.failed).toBe(0);

    const rows = await Promise.all([
      prisma.product.findUnique({ where: { id: p1 } }),
      prisma.product.findUnique({ where: { id: p2.id } }),
      prisma.blogPost.findUnique({ where: { id: b1 } }),
    ]);
    for (const row of rows) expect(row?.status).toBe('published');
  });

  it('audit log kaydı: action=publish, entityType=Product/BlogPost', async () => {
    const { productId } = await seedBasicProduct(prisma, { status: 'scheduled' });
    await prisma.product.update({
      where: { id: productId },
      data: { scheduledAt: new Date(Date.now() - 1000) },
    });

    await scheduler.publishScheduled();

    const audit = await prisma.auditLog.findFirst({
      where: { entityType: 'Product', entityId: productId, action: 'publish' },
    });
    expect(audit).not.toBeNull();
  });

  it("draft/published olanlar transition'a dahil değil", async () => {
    await seedBasicProduct(prisma, { status: 'draft' });
    await seedBlogPost(prisma, { status: 'published', authorId: adminId });

    const result = await scheduler.publishScheduled();

    expect(result.productsPublished).toBe(0);
    expect(result.blogPostsPublished).toBe(0);
  });
});
