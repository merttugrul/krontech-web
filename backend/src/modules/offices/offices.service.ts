import { Injectable, NotFoundException } from '@nestjs/common';
import { Office } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { CreateOfficeDto, OfficeLocale } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';

const ENTITY_TYPE = 'Office';
const CACHE_NS = 'offices';

@Injectable()
export class OfficesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ──────────────────────────────────────
  // PUBLIC
  // ──────────────────────────────────────

  /**
   * Locale'e göre ofis listesi (order asc). Footer/contact sayfasında full listeyi
   * tek seferde alıp render etmek istiyoruz — pagination yok.
   */
  async listPublic(locale: OfficeLocale): Promise<Office[]> {
    const cacheKey = `${CACHE_NS}:list:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      () =>
        this.prisma.office.findMany({
          where: { locale },
          orderBy: [{ order: 'asc' }, { city: 'asc' }],
        }),
      600,
    );
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async listAdmin(): Promise<Office[]> {
    return this.prisma.office.findMany({
      orderBy: [{ locale: 'asc' }, { order: 'asc' }, { city: 'asc' }],
    });
  }

  async findById(id: string): Promise<Office> {
    const o = await this.prisma.office.findUnique({ where: { id } });
    if (!o) throw new NotFoundException(`Office ${id} not found`);
    return o;
  }

  async create(dto: CreateOfficeDto, userId: string): Promise<Office> {
    const created = await this.prisma.office.create({
      data: {
        city: dto.city,
        email: dto.email,
        phone: dto.phone,
        fax: dto.fax,
        address: dto.address,
        image: dto.image,
        imagePosition: dto.imagePosition ?? 'right',
        order: dto.order ?? 0,
        locale: dto.locale ?? 'en',
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

    this.triggerOfficesRevalidation();

    return created;
  }

  async update(id: string, dto: UpdateOfficeDto, userId: string): Promise<Office> {
    const existing = await this.findById(id);

    const updated = await this.prisma.office.update({
      where: { id },
      data: {
        city: dto.city,
        email: dto.email,
        phone: dto.phone,
        fax: dto.fax,
        address: dto.address,
        image: dto.image,
        imagePosition: dto.imagePosition,
        order: dto.order,
        locale: dto.locale,
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

    this.triggerOfficesRevalidation();

    return updated;
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findById(id);
    await this.prisma.office.delete({ where: { id } });

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

    this.triggerOfficesRevalidation();

    return { id };
  }

  /**
   * Footer + iletişim sayfası ISR; sitemap'te contact URL'leri var.
   */
  private triggerOfficesRevalidation(): void {
    const paths = ['/contact', '/tr/contact'];
    void this.cache.invalidateNamespace('sitemap').catch(() => undefined);
    void this.revalidation
      .revalidate({ tags: ['offices', 'sitemap'], paths })
      .catch(() => undefined);
  }
}
