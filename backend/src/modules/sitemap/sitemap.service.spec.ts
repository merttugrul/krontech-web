import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContentStatus } from '@prisma/client';
import { SitemapService } from './sitemap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

describe('SitemapService', () => {
  let service: SitemapService;
  let prisma: {
    product: Record<string, jest.Mock>;
    blogPost: Record<string, jest.Mock>;
    resource: Record<string, jest.Mock>;
  };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
      blogPost: { findMany: jest.fn().mockResolvedValue([]) },
      resource: { findMany: jest.fn().mockResolvedValue([]) },
    };
    // Cache mocklandı, getOrSet loader çalıştırır
    cache = {
      getOrSet: jest.fn().mockImplementation(async (_k: string, loader: () => unknown) => loader()),
      invalidateNamespace: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitemapService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((k: string, d?: string) =>
              k === 'NEXT_PUBLIC_SITE_URL' ? 'https://krontech.com' : d,
            ),
          },
        },
      ],
    }).compile();

    service = module.get(SitemapService);
  });

  describe('collectUrls', () => {
    it('her locale için statik sayfalar var', async () => {
      const urls = await service.collectUrls();
      const locs = urls.map((u) => u.loc);

      expect(locs).toContain('https://krontech.com/en');
      expect(locs).toContain('https://krontech.com/tr');
      expect(locs).toContain('https://krontech.com/en/products');
      expect(locs).toContain('https://krontech.com/tr/products');
      expect(locs).toContain('https://krontech.com/en/blog');
      expect(locs).toContain('https://krontech.com/en/about');
      expect(locs).toContain('https://krontech.com/en/contact');
    });

    it('published products her locale için URL üretir', async () => {
      prisma.product.findMany.mockResolvedValue([
        { slug: 'widget-a', updatedAt: new Date('2026-04-01'), publishedAt: new Date() },
      ]);

      const urls = await service.collectUrls();
      const locs = urls.map((u) => u.loc);

      expect(locs).toContain('https://krontech.com/en/products/widget-a');
      expect(locs).toContain('https://krontech.com/tr/products/widget-a');
    });

    it('sadece published ürünler sorgulanır', async () => {
      await service.collectUrls();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          status: ContentStatus.published,
          publishedAt: { lte: expect.any(Date) },
        },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('resources locale kolonuna göre tek URL üretir', async () => {
      prisma.resource.findMany.mockResolvedValue([
        { id: 'r1', locale: 'tr', updatedAt: new Date('2026-03-15') },
      ]);

      const urls = await service.collectUrls();
      const locs = urls.map((u) => u.loc);

      expect(locs).toContain('https://krontech.com/tr/resources/r1');
      expect(locs).not.toContain('https://krontech.com/en/resources/r1');
    });

    it('blog posts her locale için URL üretir', async () => {
      prisma.blogPost.findMany.mockResolvedValue([
        { slug: 'launch', updatedAt: new Date(), publishedAt: new Date() },
      ]);

      const urls = await service.collectUrls();
      const locs = urls.map((u) => u.loc);
      expect(locs).toContain('https://krontech.com/en/blog/launch');
      expect(locs).toContain('https://krontech.com/tr/blog/launch');
    });

    it('base URL env yoksa localhost fallback', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SitemapService,
          { provide: PrismaService, useValue: prisma },
          { provide: CacheService, useValue: cache },
          {
            provide: ConfigService,
            useValue: { get: jest.fn((_k, d?: string) => d) },
          },
        ],
      }).compile();
      const s = module.get(SitemapService);

      const urls = await s.collectUrls();
      expect(urls[0].loc.startsWith('http://localhost:3000/')).toBe(true);
    });
  });

  describe('buildXml', () => {
    it('XML declaration + urlset ile sarar', async () => {
      const xml = await service.buildXml();
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toMatch(/<\/urlset>\s*$/);
    });

    it('her <url> için <loc><lastmod><changefreq><priority>', async () => {
      const xml = await service.buildXml();
      expect(xml).toMatch(/<url>[\s\S]*?<loc>.+?<\/loc>[\s\S]*?<\/url>/);
      expect(xml).toContain('<changefreq>');
      expect(xml).toContain('<priority>');
    });

    it('XML special chars escape edilir', async () => {
      prisma.product.findMany.mockResolvedValue([
        { slug: 'a&b', updatedAt: new Date(), publishedAt: new Date() },
      ]);

      const xml = await service.buildXml();
      expect(xml).toContain('a&amp;b');
      expect(xml).not.toMatch(/<loc>[^<]*a&b[^<]*<\/loc>/); // raw & yok
    });

    it('cache getOrSet 1 saatlik TTL ile çağrılır', async () => {
      await service.buildXml();
      expect(cache.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('sitemap'),
        expect.any(Function),
        3600,
      );
    });
  });

  describe('invalidate', () => {
    it('sitemap namespace invalidate eder', async () => {
      await service.invalidate();
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('sitemap');
    });
  });
});
