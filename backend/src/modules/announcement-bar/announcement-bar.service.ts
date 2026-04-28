import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementBar, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateAnnouncementBarDto } from './dto/create-announcement-bar.dto';
import { UpdateAnnouncementBarDto } from './dto/update-announcement-bar.dto';

const ENTITY_TYPE = 'AnnouncementBar';
const CACHE_NS = 'announcement';

@Injectable()
export class AnnouncementBarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  // ──────────────────────────────────────
  // PUBLIC
  // ──────────────────────────────────────

  /**
   * Verilen locale için şu anda aktif duyuru bandını döner.
   * Kriterler:
   *   - isActive = true
   *   - startDate null veya <= now
   *   - endDate null veya >= now
   * Birden fazla aktif varsa `updatedAt desc` — en son güncellenen öne çıkar.
   */
  async findActive(locale: string): Promise<AnnouncementBar | null> {
    const cacheKey = `${CACHE_NS}:active:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const where: Prisma.AnnouncementBarWhereInput = {
          locale,
          isActive: true,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        };
        return this.prisma.announcementBar.findFirst({
          where,
          orderBy: { updatedAt: 'desc' },
        });
      },
      60, // 1 dk — tarih aralığı sınırında gecikme kabul edilebilir
    );
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async list(): Promise<AnnouncementBar[]> {
    return this.prisma.announcementBar.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<AnnouncementBar> {
    const bar = await this.prisma.announcementBar.findUnique({ where: { id } });
    if (!bar) throw new NotFoundException(`AnnouncementBar ${id} not found`);
    return bar;
  }

  async create(dto: CreateAnnouncementBarDto, userId: string): Promise<AnnouncementBar> {
    this.assertDateRange(dto.startDate, dto.endDate);

    const created = await this.prisma.announcementBar.create({
      data: {
        locale: dto.locale ?? 'en',
        text: dto.text,
        linkUrl: dto.linkUrl,
        linkLabel: dto.linkLabel,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    await Promise.all([
      this.audit.record({
        userId,
        action: 'create',
        entityType: ENTITY_TYPE,
        entityId: created.id,
        newData: created,
      }),
      this.cache.invalidateNamespace(CACHE_NS),
    ]);

    return created;
  }

  async update(
    id: string,
    dto: UpdateAnnouncementBarDto,
    userId: string,
  ): Promise<AnnouncementBar> {
    const existing = await this.findById(id);

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : dto.startDate === null
        ? null
        : existing.startDate;
    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : dto.endDate === null
        ? null
        : existing.endDate;

    this.assertDateRange(
      startDate ? startDate.toISOString() : undefined,
      endDate ? endDate.toISOString() : undefined,
    );

    const updated = await this.prisma.announcementBar.update({
      where: { id },
      data: {
        locale: dto.locale,
        text: dto.text,
        linkUrl: dto.linkUrl,
        linkLabel: dto.linkLabel,
        isActive: dto.isActive,
        startDate: dto.startDate !== undefined ? startDate : undefined,
        endDate: dto.endDate !== undefined ? endDate : undefined,
      },
    });

    await Promise.all([
      this.audit.record({
        userId,
        action: 'update',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
        newData: updated,
      }),
      this.cache.invalidateNamespace(CACHE_NS),
    ]);

    return updated;
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findById(id);
    await this.prisma.announcementBar.delete({ where: { id } });

    await Promise.all([
      this.audit.record({
        userId,
        action: 'delete',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
      }),
      this.cache.invalidateNamespace(CACHE_NS),
    ]);

    return { id };
  }

  // ──────────────────────────────────────
  // PRIVATE
  // ──────────────────────────────────────

  private assertDateRange(start?: string, end?: string): void {
    if (!start || !end) return;
    if (new Date(start) >= new Date(end)) {
      throw new BadRequestException("startDate, endDate'den önce olmalı");
    }
  }
}
