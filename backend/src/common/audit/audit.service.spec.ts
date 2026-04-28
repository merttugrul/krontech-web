import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    auditLog: { create: jest.Mock };
    contentVersion: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      auditLog: { create: jest.fn() },
      contentVersion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AuditService);
  });

  describe('record', () => {
    it('auditLog.create doğru payload ile çağrılır', async () => {
      await service.record({
        userId: 'u1',
        action: 'publish',
        entityType: 'Product',
        entityId: 'p1',
        oldData: { a: 1 },
        newData: { a: 2 },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          action: 'publish',
          entityType: 'Product',
          entityId: 'p1',
          oldData: { a: 1 },
          newData: { a: 2 },
        }),
      });
    });

    it('DB hatası → exception fırlatmaz (ana akış bozulmamalı)', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('boom'));

      await expect(
        service.record({ action: 'create', entityType: 'X', entityId: 'y' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('snapshot', () => {
    it('ilk versiyon → version=1', async () => {
      prisma.contentVersion.findFirst.mockResolvedValue(null);
      prisma.contentVersion.create.mockResolvedValue(undefined);

      await service.snapshot({
        entityType: 'Product',
        entityId: 'p1',
        data: { snap: true },
        userId: 'u1',
      });

      expect(prisma.contentVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'Product',
          entityId: 'p1',
          version: 1,
          createdBy: 'u1',
        }),
      });
    });

    it('son versiyon 3 ise yeni versiyon=4', async () => {
      prisma.contentVersion.findFirst.mockResolvedValue({ version: 3 });
      prisma.contentVersion.create.mockResolvedValue(undefined);

      await service.snapshot({ entityType: 'Product', entityId: 'p1', data: {} });

      expect(prisma.contentVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ version: 4 }),
      });
    });

    it('DB hatası → exception fırlatmaz', async () => {
      prisma.contentVersion.findFirst.mockRejectedValue(new Error('x'));
      await expect(
        service.snapshot({ entityType: 'X', entityId: 'y', data: {} }),
      ).resolves.toBeUndefined();
    });
  });

  describe('listVersions', () => {
    it('ilgili entity için desc sırada versiyon listesi döner', async () => {
      prisma.contentVersion.findMany.mockResolvedValue([
        { version: 3, createdAt: new Date(), createdBy: 'u1' },
        { version: 2, createdAt: new Date(), createdBy: 'u2' },
        { version: 1, createdAt: new Date(), createdBy: null },
      ]);

      const result = await service.listVersions('Product', 'p1');

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(prisma.contentVersion.findMany).toHaveBeenCalledWith({
        where: { entityType: 'Product', entityId: 'p1' },
        orderBy: { version: 'desc' },
        select: { version: true, createdAt: true, createdBy: true },
      });
    });
  });
});
