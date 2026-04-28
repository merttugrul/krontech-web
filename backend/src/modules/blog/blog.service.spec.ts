import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ContentStatus, PostType } from '@prisma/client';
import { BlogService } from './blog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';

describe('BlogService', () => {
  let service: BlogService;
  let prisma: {
    blogPost: Record<string, jest.Mock>;
    blogPostTranslation: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };
  let audit: { record: jest.Mock; snapshot: jest.Mock; listVersions: jest.Mock };

  const userId = 'admin-user-id';

  const validEn = {
    locale: 'en' as const,
    title: 'Sample Blog Title',
    excerpt: 'Long enough excerpt for validation rules.',
    content: '<p>HTML content here</p>',
  };
  const validTr = {
    locale: 'tr' as const,
    title: 'Örnek Blog Başlığı',
    excerpt: 'Validasyon için yeterince uzun bir özet.',
    content: '<p>HTML içerik</p>',
  };

  beforeEach(async () => {
    prisma = {
      blogPost: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        // update default olarak Promise döner → fire-and-forget viewCount increment
        // çağrısı .catch() zincirinde patlamasın diye.
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn(),
        count: jest.fn(),
      },
      blogPostTranslation: { upsert: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (cb: unknown) => {
        if (typeof cb === 'function') return cb(prisma);
        return cb;
      }),
    };
    cache = {
      getOrSet: jest.fn(),
      invalidateNamespace: jest.fn().mockResolvedValue(0),
    };
    audit = {
      record: jest.fn().mockResolvedValue(undefined),
      snapshot: jest.fn().mockResolvedValue(undefined),
      listVersions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
        {
          provide: RevalidationService,
          useValue: { revalidate: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(BlogService);
  });

  describe('create', () => {
    it('sadece TR translation ile create başarılı (slug TR başlıktan üretilir)', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'ornek-blog-basligi',
        translations: [validTr],
        author: null,
      });

      const dto: CreateBlogPostDto = { translations: [validTr] };
      await service.create(dto, userId);

      expect(prisma.blogPost.create).toHaveBeenCalled();
    });

    it('authorId verilmezse isteği yapan user yazar atanır', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'sample-blog-title',
        translations: [],
        author: null,
      });

      const dto: CreateBlogPostDto = { translations: [validEn] };
      await service.create(dto, userId);

      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ authorId: userId }),
        }),
      );
    });

    it('verilen authorId yoksa BadRequestException', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      const dto: CreateBlogPostDto = {
        authorId: 'ghost-author',
        translations: [validEn],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it("slug verilmezse EN title'dan normalize edilir", async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'sample-blog-title',
        translations: [],
        author: null,
      });

      const dto: CreateBlogPostDto = { translations: [validEn] };
      await service.create(dto, userId);

      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'sample-blog-title' }),
        }),
      );
    });

    it('TR karakterli slug normalize edilir', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        translations: [],
        author: null,
      });

      const dto: CreateBlogPostDto = {
        slug: 'Öne-Çıkan-Yazı!',
        translations: [validEn],
      };
      await service.create(dto, userId);

      const arg = prisma.blogPost.create.mock.calls[0][0] as { data: { slug: string } };
      expect(arg.data.slug).toBe('one-cikan-yazi');
    });

    it('slug çakışırsa ConflictException', async () => {
      prisma.blogPost.findUnique.mockResolvedValue({ id: 'existing', slug: 'sample-blog-title' });
      prisma.user.findUnique.mockResolvedValue({ id: userId });

      const dto: CreateBlogPostDto = { translations: [validEn] };
      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
    });

    it('status=scheduled ama scheduledAt yok → BadRequestException', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });

      const dto: CreateBlogPostDto = {
        status: ContentStatus.scheduled,
        translations: [validEn],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('scheduledAt geçmişte → BadRequestException', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });

      const dto: CreateBlogPostDto = {
        status: ContentStatus.scheduled,
        scheduledAt: '2020-01-01T00:00:00Z',
        translations: [validEn],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('status=published ise publishedAt otomatik set edilir', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        translations: [],
        author: null,
      });

      const dto: CreateBlogPostDto = {
        status: ContentStatus.published,
        translations: [validEn],
      };
      await service.create(dto, userId);

      const arg = prisma.blogPost.create.mock.calls[0][0] as {
        data: { publishedAt: Date | null };
      };
      expect(arg.data.publishedAt).toBeInstanceOf(Date);
    });

    it('type default olarak "blog"; news olarak override edilebilir', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        translations: [],
        author: null,
      });

      await service.create({ type: PostType.news, translations: [validEn] }, userId);

      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: PostType.news }),
        }),
      );
    });

    it('başarılı create sonrası audit.record + audit.snapshot + cache invalidate çağrılır', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'sample-blog-title',
        translations: [],
        author: null,
      });

      await service.create({ translations: [validEn] }, userId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'BlogPost',
          entityId: 'p1',
          userId,
        }),
      );
      expect(audit.snapshot).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'BlogPost', entityId: 'p1' }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('blog');
    });

    it('faqItems gönderilirse JSON olarak saklanır', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.blogPost.create.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        translations: [],
        author: null,
      });

      const dto: CreateBlogPostDto = {
        translations: [
          {
            ...validEn,
            faqItems: [{ question: 'What is PAM?', answer: 'Privileged Access Management.' }],
          },
        ],
      };
      await service.create(dto, userId);

      const arg = prisma.blogPost.create.mock.calls[0][0] as {
        data: { translations: { create: Array<{ faqItems: unknown }> } };
      };
      expect(arg.data.translations.create[0].faqItems).toEqual([
        { question: 'What is PAM?', answer: 'Privileged Access Management.' },
      ]);
    });
  });

  describe('findBySlugPublic', () => {
    it('draft → NotFoundException', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.blogPost.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        publishedAt: null,
        translations: [],
        author: null,
      });

      await expect(service.findBySlugPublic('x', 'en')).rejects.toThrow(NotFoundException);
    });

    it('publishedAt gelecekte → NotFoundException', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      const future = new Date();
      future.setDate(future.getDate() + 1);
      prisma.blogPost.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.published,
        publishedAt: future,
        translations: [],
        author: null,
      });

      await expect(service.findBySlugPublic('x', 'en')).rejects.toThrow(NotFoundException);
    });

    it('translation yok (sadece EN var, TR istenmiş) → NotFoundException', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.blogPost.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.published,
        publishedAt: new Date(Date.now() - 1000),
        translations: [],
        author: null,
      });

      await expect(service.findBySlugPublic('x', 'tr')).rejects.toThrow(NotFoundException);
    });

    it('başarılı detail → content + faqItems + SEO alanları döner', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.blogPost.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        type: PostType.blog,
        coverImage: null,
        status: ContentStatus.published,
        publishedAt: new Date(Date.now() - 1000),
        isHighlight: false,
        viewCount: 3,
        translations: [
          {
            locale: 'en',
            title: 'T',
            excerpt: 'ex',
            content: '<p>body</p>',
            faqItems: [{ question: 'q', answer: 'a' }],
            metaTitle: 'SEO',
            metaDescription: null,
            canonicalUrl: null,
            ogImage: null,
            noIndex: false,
          },
        ],
        author: { id: userId, email: 'admin@x.com', role: 'admin' },
      });

      const result = await service.findBySlugPublic('x', 'en');
      expect(result.content).toBe('<p>body</p>');
      expect(result.faqItems).toEqual([{ question: 'q', answer: 'a' }]);
      expect(result.metaTitle).toBe('SEO');
      expect(result.author).toEqual({ id: userId, email: 'admin@x.com' });
    });

    it('başarılı detail sonrası viewCount increment fire-and-forget çağrılır', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.blogPost.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        type: PostType.blog,
        coverImage: null,
        status: ContentStatus.published,
        publishedAt: new Date(Date.now() - 1000),
        isHighlight: false,
        viewCount: 0,
        translations: [
          {
            locale: 'en',
            title: 'T',
            excerpt: 'e',
            content: 'c',
            faqItems: null,
            metaTitle: null,
            metaDescription: null,
            canonicalUrl: null,
            ogImage: null,
            noIndex: false,
          },
        ],
        author: null,
      });
      prisma.blogPost.update.mockResolvedValue({});

      await service.findBySlugPublic('x', 'en');

      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { slug: 'x' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('publish', () => {
    it('publish → status=published + audit + cache invalidate', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        publishedAt: null,
        translations: [],
        author: null,
      };
      prisma.blogPost.findUnique.mockResolvedValue(existing);
      prisma.blogPost.update.mockResolvedValue({
        ...existing,
        status: ContentStatus.published,
        publishedAt: new Date(),
      });

      await service.publish('p1', userId);

      expect(prisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ContentStatus.published }),
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('blog');
    });
  });

  describe('schedule', () => {
    it('geçmiş tarih → BadRequestException', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        author: null,
      };
      prisma.blogPost.findUnique.mockResolvedValue(existing);

      await expect(service.schedule('p1', '2020-01-01T00:00:00Z', userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('gelecek tarih → status=scheduled + audit', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        author: null,
      };
      prisma.blogPost.findUnique.mockResolvedValue(existing);
      prisma.blogPost.update.mockResolvedValue({
        ...existing,
        status: ContentStatus.scheduled,
        scheduledAt: future,
      });

      await service.schedule('p1', future.toISOString(), userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'schedule' }));
    });
  });

  describe('delete', () => {
    it('hard delete → audit + cache', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        author: null,
      };
      prisma.blogPost.findUnique.mockResolvedValue(existing);
      prisma.blogPost.delete.mockResolvedValue(existing);

      await service.delete('p1', userId);

      expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', oldData: existing }),
      );
    });

    it('olmayan id → NotFoundException', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      await expect(service.delete('missing', userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAdmin', () => {
    it("pagination + search + type filter where clause'a uygulanır", async () => {
      prisma.blogPost.findMany.mockResolvedValue([]);
      prisma.blogPost.count.mockResolvedValue(0);

      await service.listAdmin({
        page: 3,
        pageSize: 10,
        search: 'krontech',
        status: ContentStatus.published,
        type: PostType.news,
      });

      expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
          where: expect.objectContaining({
            status: ContentStatus.published,
            type: PostType.news,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });
});
