import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';

describe('OfficesService', () => {
  let service: OfficesService;
  let prisma: { office: Record<string, jest.Mock> };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };
  let audit: { record: jest.Mock };
  let revalidation: { revalidate: jest.Mock };

  const userId = 'admin-1';

  const baseDto = {
    city: 'Istanbul',
    email: 'info@kron.com.tr',
    phone: '+90 212 555 44 33',
    address: 'Maslak No:1 Istanbul Türkiye',
  };

  beforeEach(async () => {
    prisma = {
      office: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    cache = {
      getOrSet: jest.fn(),
      invalidateNamespace: jest.fn().mockResolvedValue(0),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    revalidation = { revalidate: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
        { provide: RevalidationService, useValue: revalidation },
      ],
    }).compile();

    service = module.get(OfficesService);
  });

  describe('listPublic', () => {
    it('cache miss → locale filter + order asc + city asc', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.office.findMany.mockResolvedValue([]);

      await service.listPublic('tr');

      expect(prisma.office.findMany).toHaveBeenCalledWith({
        where: { locale: 'tr' },
        orderBy: [{ order: 'asc' }, { city: 'asc' }],
      });
    });
  });

  describe('create', () => {
    it('default değerler → locale=en, imagePosition=right, order=0', async () => {
      prisma.office.create.mockResolvedValue({ id: 'o1' });

      await service.create(baseDto, userId);

      expect(prisma.office.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          locale: 'en',
          imagePosition: 'right',
          order: 0,
        }),
      });
    });

    it('audit + cache invalidate', async () => {
      prisma.office.create.mockResolvedValue({ id: 'o1' });

      await service.create(baseDto, userId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'Office' }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('offices');
      expect(revalidation.revalidate).toHaveBeenCalledWith({
        tags: ['offices', 'sitemap'],
        paths: ['/contact', '/tr/contact'],
      });
    });
  });

  describe('findById', () => {
    it('olmayan → NotFoundException', async () => {
      prisma.office.findUnique.mockResolvedValue(null);
      await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('başarılı update → audit + cache invalidate', async () => {
      prisma.office.findUnique.mockResolvedValue({ id: 'o1', city: 'Old' });
      prisma.office.update.mockResolvedValue({ id: 'o1', city: 'New' });

      await service.update('o1', { city: 'New' }, userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('offices');
      expect(revalidation.revalidate).toHaveBeenCalledWith({
        tags: ['offices', 'sitemap'],
        paths: ['/contact', '/tr/contact'],
      });
    });
  });

  describe('delete', () => {
    it('başarılı delete', async () => {
      prisma.office.findUnique.mockResolvedValue({ id: 'o1' });
      prisma.office.delete.mockResolvedValue({});

      await service.delete('o1', userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('offices');
      expect(revalidation.revalidate).toHaveBeenCalledWith({
        tags: ['offices', 'sitemap'],
        paths: ['/contact', '/tr/contact'],
      });
    });
  });
});
