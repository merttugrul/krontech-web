import { Test, TestingModule } from '@nestjs/testing';
import { ContentStatus } from '@prisma/client';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { RevalidationService } from '../revalidation/revalidation.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: {
    product: Record<string, jest.Mock>;
    blogPost: Record<string, jest.Mock>;
  };
  let cache: { invalidateNamespace: jest.Mock };
  let audit: { record: jest.Mock };
  let revalidation: { revalidate: jest.Mock };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn(), update: jest.fn() },
      blogPost: { findMany: jest.fn(), update: jest.fn() },
    };
    cache = { invalidateNamespace: jest.fn().mockResolvedValue(0) };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    revalidation = { revalidate: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
        { provide: RevalidationService, useValue: revalidation },
      ],
    }).compile();

    service = module.get(SchedulerService);
  });

  it('hiç kayıt yok → 0/0/0, cache/revalidation çağrılmaz', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    prisma.blogPost.findMany.mockResolvedValue([]);

    const res = await service.publishScheduled();

    expect(res).toEqual({ productsPublished: 0, blogPostsPublished: 0, failed: 0 });
    expect(cache.invalidateNamespace).not.toHaveBeenCalled();
    expect(revalidation.revalidate).not.toHaveBeenCalled();
  });

  it('2 product + 1 blog → transition + audit + cache + revalidation', async () => {
    const now = new Date('2026-05-01T10:00:00Z');
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', slug: 'widget-a', publishedAt: null, scheduledAt: now },
      { id: 'p2', slug: 'widget-b', publishedAt: null, scheduledAt: now },
    ]);
    prisma.blogPost.findMany.mockResolvedValue([
      { id: 'b1', slug: 'my-post', publishedAt: null, scheduledAt: now },
    ]);
    prisma.product.update.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id, status: ContentStatus.published }),
    );
    prisma.blogPost.update.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id, status: ContentStatus.published }),
    );

    const res = await service.publishScheduled(now);

    expect(res).toEqual({ productsPublished: 2, blogPostsPublished: 1, failed: 0 });
    expect(prisma.product.update).toHaveBeenCalledTimes(2);
    expect(prisma.blogPost.update).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(3);

    // Cache invalidations: products + blog + sitemap
    const invalidated = cache.invalidateNamespace.mock.calls.map((c: string[]) => c[0]);
    expect(invalidated).toEqual(expect.arrayContaining(['products', 'blog', 'sitemap']));

    // Revalidation çağrıldı, tags: products, blog, sitemap
    expect(revalidation.revalidate).toHaveBeenCalledTimes(1);
    const revalidateArg = revalidation.revalidate.mock.calls[0][0];
    expect(revalidateArg.tags).toEqual(expect.arrayContaining(['products', 'blog', 'sitemap']));
    expect(revalidateArg.paths).toEqual(
      expect.arrayContaining(['/products/widget-a', '/products/widget-b', '/blog/my-post']),
    );
  });

  it('findMany filtreleri doğru: status=scheduled + scheduledAt<=now', async () => {
    const now = new Date('2026-05-01T10:00:00Z');
    prisma.product.findMany.mockResolvedValue([]);
    prisma.blogPost.findMany.mockResolvedValue([]);

    await service.publishScheduled(now);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { status: ContentStatus.scheduled, scheduledAt: { lte: now } },
      select: expect.any(Object),
    });
    expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
      where: { status: ContentStatus.scheduled, scheduledAt: { lte: now } },
      select: expect.any(Object),
    });
  });

  it("bir ürün update'i hata atarsa diğerleri etkilenmez", async () => {
    const now = new Date();
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', slug: 'a', publishedAt: null, scheduledAt: now },
      { id: 'p2', slug: 'b', publishedAt: null, scheduledAt: now },
    ]);
    prisma.blogPost.findMany.mockResolvedValue([]);
    prisma.product.update
      .mockRejectedValueOnce(new Error('DB unreachable'))
      .mockResolvedValueOnce({ id: 'p2', status: ContentStatus.published });

    const res = await service.publishScheduled(now);

    expect(res.productsPublished).toBe(1);
    expect(res.failed).toBe(1);
  });

  it('publishedAt zaten doluysa korur (override etmez)', async () => {
    const now = new Date('2026-05-01T10:00:00Z');
    const existing = new Date('2026-04-01T00:00:00Z');
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', slug: 'a', publishedAt: existing, scheduledAt: now },
    ]);
    prisma.blogPost.findMany.mockResolvedValue([]);
    prisma.product.update.mockResolvedValue({ id: 'p1' });

    await service.publishScheduled(now);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: {
        status: ContentStatus.published,
        publishedAt: existing, // Değişmedi
        scheduledAt: null,
      },
    });
  });

  it('@Cron handler NODE_ENV=test → skip', async () => {
    const spy = jest.spyOn(service, 'publishScheduled');
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      const res = await service.handlePublishScheduled();
      expect(res).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
