import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnnouncementBarService } from './announcement-bar.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';

describe('AnnouncementBarService', () => {
  let service: AnnouncementBarService;
  let prisma: { announcementBar: Record<string, jest.Mock> };
  let cache: { getOrSet: jest.Mock; invalidateNamespace: jest.Mock };
  let audit: { record: jest.Mock };

  const userId = 'admin-1';

  beforeEach(async () => {
    prisma = {
      announcementBar: {
        findFirst: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementBarService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(AnnouncementBarService);
  });

  describe('findActive', () => {
    it('locale + isActive + tarih aralığı filter ile findFirst', async () => {
      cache.getOrSet.mockImplementation(async (_k: string, loader: () => unknown) => loader());
      prisma.announcementBar.findFirst.mockResolvedValue(null);

      await service.findActive('tr');

      const call = prisma.announcementBar.findFirst.mock.calls[0][0] as {
        where: { locale: string; isActive: boolean; AND: unknown[] };
      };
      expect(call.where.locale).toBe('tr');
      expect(call.where.isActive).toBe(true);
      expect(call.where.AND).toHaveLength(2);
    });

    it('cache hit → loader çağrılmaz', async () => {
      cache.getOrSet.mockResolvedValue({ id: 'cached' });

      await service.findActive('en');
      expect(prisma.announcementBar.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('startDate >= endDate → BadRequestException', async () => {
      await expect(
        service.create(
          {
            text: 'Hello',
            startDate: '2026-12-31T00:00:00Z',
            endDate: '2026-01-01T00:00:00Z',
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('başarılı create → audit + cache invalidate', async () => {
      prisma.announcementBar.create.mockResolvedValue({ id: 'a1', text: 'x' });

      await service.create({ text: 'Bizimle tanışın!' }, userId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'AnnouncementBar',
        }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('announcement');
    });

    it('startDate+endDate Date tipine dönüştürülür', async () => {
      prisma.announcementBar.create.mockResolvedValue({ id: 'a1' });

      await service.create(
        {
          text: 'bar text',
          startDate: '2026-05-01T00:00:00.000Z',
          endDate: '2026-06-01T00:00:00.000Z',
        },
        userId,
      );

      const arg = prisma.announcementBar.create.mock.calls[0][0] as {
        data: { startDate: Date; endDate: Date };
      };
      expect(arg.data.startDate).toBeInstanceOf(Date);
      expect(arg.data.endDate).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('olmayan id → NotFoundException', async () => {
      prisma.announcementBar.findUnique.mockResolvedValue(null);
      await expect(service.update('x', { text: 'new' }, userId)).rejects.toThrow(NotFoundException);
    });

    it('başarılı update + audit + cache invalidate', async () => {
      prisma.announcementBar.findUnique.mockResolvedValue({
        id: 'a1',
        text: 'old',
        startDate: null,
        endDate: null,
      });
      prisma.announcementBar.update.mockResolvedValue({ id: 'a1', text: 'new' });

      await service.update('a1', { text: 'new' }, userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('announcement');
    });
  });

  describe('delete', () => {
    it('başarılı delete', async () => {
      prisma.announcementBar.findUnique.mockResolvedValue({ id: 'a1' });
      prisma.announcementBar.delete.mockResolvedValue({});

      await service.delete('a1', userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('announcement');
    });
  });
});
