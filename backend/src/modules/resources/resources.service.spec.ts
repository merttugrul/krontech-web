import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContentStatus, ResourceType } from '@prisma/client';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: {
    resource: Record<string, jest.Mock>;
    product: Record<string, jest.Mock>;
  };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };
  let audit: { record: jest.Mock };

  const userId = 'admin-user';

  const baseDto = {
    type: ResourceType.datasheet,
    fileUrl: 'https://files/x.pdf',
    title: 'Test Datasheet',
  };

  beforeEach(async () => {
    prisma = {
      resource: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: { findUnique: jest.fn() },
    };
    cache = {
      getOrSet: jest.fn(),
      invalidateNamespace: jest.fn().mockResolvedValue(0),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
        {
          provide: RevalidationService,
          useValue: { revalidate: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(ResourcesService);
  });

  describe('create', () => {
    it('başarılı create → audit + cache invalidate', async () => {
      prisma.resource.create.mockResolvedValue({ id: 'r1', title: 'Test Datasheet' });

      await service.create(baseDto, userId);

      expect(prisma.resource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ResourceType.datasheet,
          locale: 'en',
          status: ContentStatus.published,
        }),
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'Resource' }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('resources');
    });

    it('verilen productId yoksa BadRequestException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.create({ ...baseDto, productId: 'ghost' }, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('status=scheduled → BadRequestException (desteklenmiyor)', async () => {
      await expect(
        service.create({ ...baseDto, status: ContentStatus.scheduled }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('olmayan id → NotFoundException', async () => {
      prisma.resource.findUnique.mockResolvedValue(null);
      await expect(service.update('r1', { title: 'X' }, userId)).rejects.toThrow(NotFoundException);
    });

    it('geçerli update → audit + cache invalidate', async () => {
      prisma.resource.findUnique.mockResolvedValue({ id: 'r1', title: 'Old' });
      prisma.resource.update.mockResolvedValue({ id: 'r1', title: 'New' });

      await service.update('r1', { title: 'New' }, userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('resources');
    });

    it('productId null → ürün doğrulaması atlanır ve bağ kaldırılır', async () => {
      prisma.resource.findUnique.mockResolvedValue({ id: 'r1', title: 'Old', productId: 'p1' });
      prisma.resource.update.mockResolvedValue({ id: 'r1', productId: null });

      await service.update('r1', { productId: null }, userId);

      expect(prisma.product.findUnique).not.toHaveBeenCalled();
      expect(prisma.resource.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ productId: null }),
        }),
      );
    });
  });

  describe('findByIdPublic', () => {
    it('draft → NotFoundException', async () => {
      prisma.resource.findUnique.mockResolvedValue({
        id: 'r1',
        status: ContentStatus.draft,
        locale: 'en',
      });
      await expect(service.findByIdPublic('r1', 'en')).rejects.toThrow(NotFoundException);
    });

    it('locale mismatch → NotFoundException', async () => {
      prisma.resource.findUnique.mockResolvedValue({
        id: 'r1',
        status: ContentStatus.published,
        locale: 'en',
      });
      await expect(service.findByIdPublic('r1', 'tr')).rejects.toThrow(NotFoundException);
    });

    it('published + locale match → kayıt döner', async () => {
      const rec = { id: 'r1', status: ContentStatus.published, locale: 'en' };
      prisma.resource.findUnique.mockResolvedValue(rec);
      await expect(service.findByIdPublic('r1', 'en')).resolves.toEqual(rec);
    });
  });

  describe('listPublic', () => {
    it('cache miss → published+locale filtre + pagination', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.resource.findMany.mockResolvedValue([]);
      prisma.resource.count.mockResolvedValue(0);

      await service.listPublic({
        locale: 'tr',
        type: ResourceType.casestudy,
        page: 2,
        pageSize: 10,
      });

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ContentStatus.published,
            locale: 'tr',
            type: ResourceType.casestudy,
          }),
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('delete', () => {
    it('olmayan id → NotFoundException', async () => {
      prisma.resource.findUnique.mockResolvedValue(null);
      await expect(service.delete('ghost', userId)).rejects.toThrow(NotFoundException);
    });

    it('başarılı delete → audit + cache', async () => {
      prisma.resource.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.resource.delete.mockResolvedValue({});

      await service.delete('r1', userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('resources');
    });
  });
});
