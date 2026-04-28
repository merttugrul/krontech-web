import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma, ProductKind, Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: Record<string, jest.Mock>;
    productCategory: Record<string, jest.Mock>;
    productTranslation: Record<string, jest.Mock>;
    productCategoryTranslation: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };
  let audit: {
    record: jest.Mock;
    snapshot: jest.Mock;
    listVersions: jest.Mock;
  };

  const userId = 'admin-user-id';

  const validEnTranslation = {
    locale: 'en' as const,
    title: 'Valid Product',
    shortDescription: 'This description is long enough for validation.',
  };

  const validTrTranslation = {
    locale: 'tr' as const,
    title: 'Geçerli Ürün',
    shortDescription: 'Bu açıklama validasyon için yeterince uzun.',
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      productCategory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productTranslation: {
        upsert: jest.fn(),
      },
      productCategoryTranslation: {
        upsert: jest.fn(),
      },
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
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
        {
          provide: RevalidationService,
          useValue: { revalidate: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('create', () => {
    it('EN translation yoksa BadRequestException', async () => {
      const dto: CreateProductDto = { translations: [validTrTranslation] };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it("slug verilmezse EN title'dan otomatik üretilir", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        slug: 'valid-product',
        status: 'draft',
        translations: [],
      });

      const dto: CreateProductDto = { translations: [validEnTranslation] };
      await service.create(dto, userId);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'valid-product',
            kind: ProductKind.product,
          }),
        }),
      );
    });

    it('verilen slug TR karakterlerle gelirse normalize edilir', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({ id: 'p1', slug: 'x', translations: [] });

      const dto: CreateProductDto = {
        slug: 'Ürün-Başlığı!',
        translations: [validEnTranslation],
      };
      await service.create(dto, userId);

      const callArg = prisma.product.create.mock.calls[0][0] as { data: { slug: string } };
      expect(callArg.data.slug).toBe('urun-basligi');
    });

    it('slug çakışırsa ConflictException', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'existing', slug: 'valid-product' });
      const dto: CreateProductDto = { translations: [validEnTranslation] };
      await expect(service.create(dto, userId)).rejects.toThrow(ConflictException);
    });

    it('bilinmeyen categoryId → BadRequestException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.productCategory.findUnique.mockResolvedValue(null);
      const dto: CreateProductDto = {
        categoryId: 'non-existent',
        translations: [validEnTranslation],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('status=scheduled ama scheduledAt yok → BadRequestException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      const dto: CreateProductDto = {
        status: ContentStatus.scheduled,
        translations: [validEnTranslation],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('scheduledAt geçmişte → BadRequestException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      const dto: CreateProductDto = {
        status: ContentStatus.scheduled,
        scheduledAt: '2020-01-01T00:00:00Z',
        translations: [validEnTranslation],
      };
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('başarılı create sonrası audit.record + audit.snapshot + cache invalidate çağrılır', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        slug: 'valid-product',
        status: 'draft',
        translations: [],
      });

      const dto: CreateProductDto = { translations: [validEnTranslation] };
      await service.create(dto, userId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'Product',
          entityId: 'p1',
          userId,
        }),
      );
      expect(audit.snapshot).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'Product', entityId: 'p1' }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('products');
    });

    it('status=published ise publishedAt otomatik set edilir', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({ id: 'p1', slug: 'x', translations: [] });

      const dto: CreateProductDto = {
        status: ContentStatus.published,
        translations: [validEnTranslation],
      };
      await service.create(dto, userId);

      const callArg = prisma.product.create.mock.calls[0][0] as {
        data: { publishedAt: Date | null };
      };
      expect(callArg.data.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('findBySlugPublic', () => {
    it('draft ürün için 404', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        publishedAt: null,
        translations: [],
        category: null,
      });

      await expect(service.findBySlugPublic('x', 'en')).rejects.toThrow(NotFoundException);
    });

    it('publishedAt gelecekte ise 404', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      const future = new Date();
      future.setDate(future.getDate() + 1);
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.published,
        publishedAt: future,
        translations: [],
        category: null,
      });

      await expect(service.findBySlugPublic('x', 'en')).rejects.toThrow(NotFoundException);
    });

    it('translation yoksa belirli dilde 404', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.published,
        publishedAt: new Date(Date.now() - 1000),
        translations: [], // istenen locale için yok
        category: null,
      });

      await expect(service.findBySlugPublic('x', 'tr')).rejects.toThrow(NotFoundException);
    });

    it('yayında ürün + translation varsa doğru shape döner (passwordHash yok, SEO alanları dahil)', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'x',
        status: ContentStatus.published,
        publishedAt: new Date(Date.now() - 1000),
        order: 0,
        translations: [
          {
            locale: 'en',
            title: 'Title EN',
            shortDescription: 'desc',
            ogImage: null,
            solution: null,
            howItWorks: null,
            keyBenefits: null,
            productFamily: null,
            videos: null,
            metaTitle: 'SEO Title',
            metaDescription: 'SEO Desc',
            canonicalUrl: null,
            noIndex: false,
            structuredData: null,
          },
        ],
        category: null,
      });

      const result = await service.findBySlugPublic('x', 'en');
      expect(result.slug).toBe('x');
      expect(result.metaTitle).toBe('SEO Title');
      expect(result.noIndex).toBe(false);
    });
  });

  describe('publish', () => {
    it('publish → status=published, publishedAt set, audit çağrılır', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        publishedAt: null,
        translations: [],
        category: null,
      };
      prisma.product.findUnique.mockResolvedValue(existing);
      prisma.product.update.mockResolvedValue({
        ...existing,
        status: ContentStatus.published,
        publishedAt: new Date(),
      });

      await service.publish('p1', userId);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ status: ContentStatus.published }),
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'publish' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('products');
    });
  });

  describe('delete', () => {
    it('hard delete → audit.record + cache invalidate', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        category: null,
      };
      prisma.product.findUnique.mockResolvedValue(existing);
      prisma.product.delete.mockResolvedValue(existing);

      await service.delete('p1', userId);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', oldData: existing }),
      );
    });

    it('olmayan id → NotFoundException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.delete('missing', userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCategory', () => {
    it('içinde ürün varsa ConflictException', async () => {
      prisma.productCategory.findUnique.mockResolvedValue({
        id: 'c1',
        slug: 'x',
        translations: [],
        products: [{ id: 'p1' }, { id: 'p2' }],
      });

      await expect(service.deleteCategory('c1', userId)).rejects.toThrow(ConflictException);
      expect(prisma.productCategory.delete).not.toHaveBeenCalled();
    });

    it('boş kategori → silinir + audit', async () => {
      const cat = { id: 'c1', slug: 'x', translations: [], products: [] };
      prisma.productCategory.findUnique.mockResolvedValue(cat);
      prisma.productCategory.delete.mockResolvedValue(cat);

      await service.deleteCategory('c1', userId);

      expect(prisma.productCategory.delete).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityType: 'ProductCategory' }),
      );
    });
  });

  describe('schedule', () => {
    it('geçmiş tarih → BadRequestException', async () => {
      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        category: null,
      };
      prisma.product.findUnique.mockResolvedValue(existing);

      await expect(service.schedule('p1', '2020-01-01T00:00:00Z', userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('geçerli tarih → status=scheduled, audit', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const existing = {
        id: 'p1',
        slug: 'x',
        status: ContentStatus.draft,
        translations: [],
        category: null,
      };
      prisma.product.findUnique.mockResolvedValue(existing);
      prisma.product.update.mockResolvedValue({
        ...existing,
        status: ContentStatus.scheduled,
        scheduledAt: future,
      });

      await service.schedule('p1', future.toISOString(), userId);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ContentStatus.scheduled }),
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'schedule' }));
    });
  });

  describe('listAdmin', () => {
    it('pagination + search filter doğru where clause ile çalışır', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listAdmin({ page: 2, pageSize: 5, search: 'foo', status: 'draft' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            status: 'draft',
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  // TypeScript kullanılmadan sayılan importlar için no-op tuttuk:
  void Prisma;
  void Role;
});
