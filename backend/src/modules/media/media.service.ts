import { Injectable, NotFoundException } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service, PresignedUploadResult } from '../../common/s3/s3.service';
import { AuditService } from '../../common/audit/audit.service';
import { PresignMediaDto } from './dto/presign-media.dto';
import { CommitMediaDto } from './dto/commit-media.dto';
import { MediaQueryDto } from './dto/query-media.dto';

const ENTITY_TYPE = 'Media';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly audit: AuditService,
  ) {}

  async presign(dto: PresignMediaDto): Promise<PresignedUploadResult> {
    return this.s3.presignPut({
      contentType: dto.mimeType,
      prefix: dto.prefix ?? 'media',
    });
  }

  async commit(dto: CommitMediaDto, userId: string): Promise<Media> {
    const publicUrl = this.s3.getPublicUrl(dto.key);

    const media = await this.prisma.media.create({
      data: {
        filename: dto.key,
        originalName: dto.originalName,
        url: publicUrl,
        mimeType: dto.mimeType,
        size: dto.size,
        width: dto.width,
        height: dto.height,
        altText: dto.altText,
        uploadedBy: userId,
      },
    });

    await this.audit.record({
      userId,
      action: 'create',
      entityType: ENTITY_TYPE,
      entityId: media.id,
      newData: media,
    });

    return media;
  }

  async list(query: MediaQueryDto): Promise<{
    items: Media[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const where: Prisma.MediaWhereInput = {};
    if (query.mimeType) {
      where.mimeType = { startsWith: query.mimeType };
    }
    if (query.search) {
      where.originalName = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.media.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`Media ${id} not found`);
    return media;
  }

  async updateAltText(id: string, altText: string, userId: string): Promise<Media> {
    const existing = await this.findById(id);
    const updated = await this.prisma.media.update({
      where: { id },
      data: { altText },
    });
    await this.audit.record({
      userId,
      action: 'update',
      entityType: ENTITY_TYPE,
      entityId: id,
      oldData: existing,
      newData: updated,
    });
    return updated;
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findById(id);

    // Önce DB'den sil — S3 silme başarısız olsa bile record gitmeli
    // (orphan S3 object ayrı cron ile temizlenecek).
    await this.prisma.media.delete({ where: { id } });
    await this.s3.deleteObject(existing.filename);

    await this.audit.record({
      userId,
      action: 'delete',
      entityType: ENTITY_TYPE,
      entityId: id,
      oldData: existing,
    });

    return { id };
  }
}
