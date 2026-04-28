import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/s3/s3.service';
import { AuditService } from '../../common/audit/audit.service';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: { media: Record<string, jest.Mock> };
  let s3: {
    presignPut: jest.Mock;
    getPublicUrl: jest.Mock;
    deleteObject: jest.Mock;
  };
  let audit: { record: jest.Mock };

  const userId = 'admin-user';

  beforeEach(async () => {
    prisma = {
      media: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    s3 = {
      presignPut: jest.fn(),
      getPublicUrl: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        { provide: S3Service, useValue: s3 },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it("presign → S3Service.presignPut'a contentType + prefix geçer", async () => {
    s3.presignPut.mockResolvedValue({
      uploadUrl: 'https://s3/put',
      key: 'media/2026/xyz',
      publicUrl: 'https://s3/public/xyz',
      expiresIn: 300,
    });

    await service.presign({
      mimeType: 'image/png',
      originalName: 'a.png',
      size: 1234,
    });

    expect(s3.presignPut).toHaveBeenCalledWith({
      contentType: 'image/png',
      prefix: 'media',
    });
  });

  it('commit → DB record + audit.record', async () => {
    s3.getPublicUrl.mockReturnValue('https://public/xyz');
    prisma.media.create.mockResolvedValue({ id: 'm1', filename: 'media/2026/xyz' });

    await service.commit(
      {
        key: 'media/2026/xyz',
        originalName: 'a.png',
        mimeType: 'image/png',
        size: 100,
        width: 800,
        height: 600,
        altText: 'alt',
      },
      userId,
    );

    expect(prisma.media.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        filename: 'media/2026/xyz',
        originalName: 'a.png',
        mimeType: 'image/png',
        size: 100,
        width: 800,
        height: 600,
        altText: 'alt',
        uploadedBy: userId,
        url: 'https://public/xyz',
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'create', entityType: 'Media' }),
    );
  });

  it('list → filter + pagination', async () => {
    prisma.media.findMany.mockResolvedValue([]);
    prisma.media.count.mockResolvedValue(0);

    await service.list({
      mimeType: 'image/',
      search: 'logo',
      page: 2,
      pageSize: 10,
    });

    expect(prisma.media.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          mimeType: { startsWith: 'image/' },
          originalName: { contains: 'logo', mode: 'insensitive' },
        },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('findById → yoksa NotFoundException', async () => {
    prisma.media.findUnique.mockResolvedValue(null);
    await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
  });

  it('updateAltText → audit + update', async () => {
    prisma.media.findUnique.mockResolvedValue({ id: 'm1', altText: null });
    prisma.media.update.mockResolvedValue({ id: 'm1', altText: 'new alt' });

    await service.updateAltText('m1', 'new alt', userId);

    expect(prisma.media.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { altText: 'new alt' },
    });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('delete → DB sil + S3 sil + audit', async () => {
    prisma.media.findUnique.mockResolvedValue({
      id: 'm1',
      filename: 'media/2026/abc',
    });
    prisma.media.delete.mockResolvedValue({});

    await service.delete('m1', userId);

    expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(s3.deleteObject).toHaveBeenCalledWith('media/2026/abc');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
  });
});
