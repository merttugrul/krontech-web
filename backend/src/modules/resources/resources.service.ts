import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma, Resource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { AdminResourceQueryDto, PublicResourceQueryDto } from './dto/query-resource.dto';

const ENTITY_TYPE = 'Resource';
const CACHE_NS = 'resources';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ──────────────────────────────────────
  // PUBLIC
  // ──────────────────────────────────────

  async listPublic(query: PublicResourceQueryDto): Promise<{
    items: Resource[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const locale = query.locale ?? 'en';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const typeKey = query.type ?? 'any';
    const productKey = query.productId ?? 'any';
    const cacheKey = `${CACHE_NS}:list:${locale}:${typeKey}:${productKey}:p=${page}:ps=${pageSize}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.ResourceWhereInput = {
          status: ContentStatus.published,
          locale,
        };
        if (query.type) where.type = query.type;
        if (query.productId) where.productId = query.productId;

        const [items, total] = await Promise.all([
          this.prisma.resource.findMany({
            where,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          this.prisma.resource.count({ where }),
        ]);

        return { items, total, page, pageSize };
      },
      300,
    );
  }

  async findByIdPublic(id: string, locale: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== ContentStatus.published || resource.locale !== locale) {
      throw new NotFoundException(`Resource ${id} not found`);
    }
    return resource;
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async listAdmin(query: AdminResourceQueryDto): Promise<{
    items: Resource[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const where: Prisma.ResourceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.locale) where.locale = query.locale;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findByIdAdmin(id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException(`Resource ${id} not found`);
    return resource;
  }

  async create(dto: CreateResourceDto, userId: string): Promise<Resource> {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new BadRequestException(`Product ${dto.productId} not found`);
    }

    if (dto.status === ContentStatus.scheduled) {
      throw new BadRequestException(
        "Resources `scheduled` status'unu desteklemez. Kullanılabilir: draft, published.",
      );
    }

    const created = await this.prisma.resource.create({
      data: {
        type: dto.type,
        productId: dto.productId,
        coverImage: dto.coverImage,
        fileUrl: dto.fileUrl,
        locale: dto.locale ?? 'en',
        title: dto.title,
        description: dto.description,
        status: dto.status ?? ContentStatus.published,
        order: dto.order ?? 0,
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
    this.triggerRevalidation(created.id, created.locale);

    return created;
  }

  async update(id: string, dto: UpdateResourceDto, userId: string): Promise<Resource> {
    const existing = await this.findByIdAdmin(id);

    if (dto.productId !== undefined && dto.productId !== null) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) throw new BadRequestException(`Product ${dto.productId} not found`);
    }

    if (dto.status === ContentStatus.scheduled) {
      throw new BadRequestException(
        "Resources `scheduled` status'unu desteklemez. Kullanılabilir: draft, published.",
      );
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        type: dto.type,
        productId: dto.productId,
        coverImage: dto.coverImage,
        fileUrl: dto.fileUrl,
        locale: dto.locale,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        order: dto.order,
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
    this.triggerRevalidation(updated.id, updated.locale);

    return updated;
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findByIdAdmin(id);
    await this.prisma.resource.delete({ where: { id } });
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
    this.triggerRevalidation(existing.id, existing.locale);
    return { id };
  }

  /**
   * Fire-and-forget: sitemap cache + frontend ISR invalidate.
   * Resource URL'i `/en/resources/:id` biçiminde (slug yok, id kullanılıyor —
   * çünkü Resource başlıkları serbest metin, slug garantisi yok).
   */
  private triggerRevalidation(id: string, locale: string): void {
    const paths = [`/${locale}/resources/${id}`];
    void this.cache.invalidateNamespace('sitemap').catch(() => undefined);
    void this.revalidation
      .revalidate({ tags: ['resources', 'sitemap'], paths })
      .catch(() => undefined);
  }
}
