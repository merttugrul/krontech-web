import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RedirectsService } from './redirects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';

describe('RedirectsService', () => {
  let service: RedirectsService;
  let prisma: { redirect: Record<string, jest.Mock> };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    invalidateNamespace: jest.Mock;
  };
  let audit: { record: jest.Mock };

  const userId = 'admin-1';

  beforeEach(async () => {
    prisma = {
      redirect: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    cache = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      invalidateNamespace: jest.fn().mockResolvedValue(0),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(RedirectsService);
  });

  describe('lookup (public hot path)', () => {
    it('cache HIT pozitif → DB sorgusu yapılmaz', async () => {
      cache.get.mockResolvedValue({ toPath: '/new', statusCode: 301 });

      const result = await service.lookup('/old');

      expect(result).toEqual({ toPath: '/new', statusCode: 301 });
      expect(prisma.redirect.findUnique).not.toHaveBeenCalled();
    });

    it('cache HIT negatif ("NONE") → null döner, DB sorgusu yok', async () => {
      cache.get.mockResolvedValue('NONE');
      expect(await service.lookup('/old')).toBeNull();
      expect(prisma.redirect.findUnique).not.toHaveBeenCalled();
    });

    it('cache MISS + DB yok → null döner + negative cache set edilir', async () => {
      cache.get.mockResolvedValue(null);
      prisma.redirect.findUnique.mockResolvedValue(null);

      expect(await service.lookup('/old')).toBeNull();
      expect(cache.set).toHaveBeenCalledWith(expect.any(String), 'NONE', 300);
    });

    it('cache MISS + inactive redirect → null + negative cache', async () => {
      cache.get.mockResolvedValue(null);
      prisma.redirect.findUnique.mockResolvedValue({
        fromPath: '/old',
        toPath: '/new',
        statusCode: 301,
        isActive: false,
      });

      expect(await service.lookup('/old')).toBeNull();
      expect(cache.set).toHaveBeenCalledWith(expect.any(String), 'NONE', 300);
    });

    it('cache MISS + aktif kayıt → result döner + pozitif cache', async () => {
      cache.get.mockResolvedValue(null);
      prisma.redirect.findUnique.mockResolvedValue({
        fromPath: '/old',
        toPath: '/new',
        statusCode: 302,
        isActive: true,
      });

      const result = await service.lookup('/old');
      expect(result).toEqual({ toPath: '/new', statusCode: 302 });
      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        { toPath: '/new', statusCode: 302 },
        300,
      );
    });

    it('trailing slash normalize edilir', async () => {
      cache.get.mockResolvedValue(null);
      prisma.redirect.findUnique.mockResolvedValue(null);

      await service.lookup('/old/');

      expect(prisma.redirect.findUnique).toHaveBeenCalledWith({
        where: { fromPath: '/old' },
      });
    });
  });

  describe('create', () => {
    it('duplicate fromPath → ConflictException', async () => {
      prisma.redirect.findUnique.mockResolvedValue({ id: 'x' });

      await expect(service.create({ fromPath: '/a', toPath: '/b' }, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('self-loop (aynı from/to) → BadRequestException', async () => {
      prisma.redirect.findUnique.mockResolvedValue(null);
      await expect(service.create({ fromPath: '/a', toPath: '/a' }, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('başarılı create → audit + cache invalidate', async () => {
      prisma.redirect.findUnique.mockResolvedValue(null);
      prisma.redirect.create.mockResolvedValue({
        id: 'r1',
        fromPath: '/a',
        toPath: '/b',
      });

      await service.create({ fromPath: '/a', toPath: '/b' }, userId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'Redirect' }),
      );
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('redirects');
    });

    it('trailing slash normalize, external toPath korunur', async () => {
      prisma.redirect.findUnique.mockResolvedValue(null);
      prisma.redirect.create.mockResolvedValue({ id: 'r1' });

      await service.create({ fromPath: '/a/', toPath: 'https://example.com/x' }, userId);

      expect(prisma.redirect.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromPath: '/a',
          toPath: 'https://example.com/x',
        }),
      });
    });
  });

  describe('update', () => {
    it('olmayan id → NotFoundException', async () => {
      prisma.redirect.findUnique.mockResolvedValue(null);
      await expect(service.update('x', {}, userId)).rejects.toThrow(NotFoundException);
    });

    it('fromPath değişirse duplicate kontrol', async () => {
      prisma.redirect.findUnique
        .mockResolvedValueOnce({ id: 'r1', fromPath: '/a', toPath: '/b' }) // findById
        .mockResolvedValueOnce({ id: 'r2' }); // duplicate check

      await expect(service.update('r1', { fromPath: '/c' }, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('başarılı update → cache invalidate', async () => {
      prisma.redirect.findUnique.mockResolvedValueOnce({
        id: 'r1',
        fromPath: '/a',
        toPath: '/b',
      });
      prisma.redirect.update.mockResolvedValue({
        id: 'r1',
        fromPath: '/a',
        toPath: '/c',
      });

      await service.update('r1', { toPath: '/c' }, userId);

      expect(cache.invalidateNamespace).toHaveBeenCalledWith('redirects');
    });
  });

  describe('delete', () => {
    it('başarılı delete', async () => {
      prisma.redirect.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.redirect.delete.mockResolvedValue({});

      await service.delete('r1', userId);

      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
      expect(cache.invalidateNamespace).toHaveBeenCalledWith('redirects');
    });
  });
});
