import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  Prisma,
  Product,
  ProductCategory,
  ProductCategoryTranslation,
  ProductKind,
  ProductTranslation,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { normalizeSlug } from '../../common/utils/slug.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto, PublicProductQueryDto } from './dto/query-product.dto';
import { Locale, ProductTranslationInput } from './dto/product-translation.dto';
import {
  CreateProductCategoryDto,
  ProductCategoryTranslationInput,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';

const ENTITY_TYPE = 'Product';
const CATEGORY_ENTITY = 'ProductCategory';
const CACHE_NS = 'products';
const CATEGORY_CACHE_NS = 'product-categories';

type ProductWithRelations = Product & {
  category: (ProductCategory & { translations: ProductCategoryTranslation[] }) | null;
  translations: ProductTranslation[];
};

export interface PublicListItem {
  id: string;
  slug: string;
  order: number;
  publishedAt: Date | null;
  category: { slug: string; name: string } | null;
  title: string;
  shortDescription: string;
  ogImage: string | null;
}

export interface PublicProductDetail extends PublicListItem {
  solution: unknown;
  howItWorks: unknown;
  keyBenefits: unknown;
  productFamily: unknown;
  videos: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: unknown;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ──────────────────────────────────────
  // CATEGORIES
  // ──────────────────────────────────────

  async listCategoriesPublic(
    locale: Locale,
  ): Promise<Array<{ id: string; slug: string; name: string; order: number }>> {
    return this.cache.getOrSet(
      `${CATEGORY_CACHE_NS}:list:${locale}`,
      async () => {
        const cats = await this.prisma.productCategory.findMany({
          orderBy: { order: 'asc' },
          include: { translations: true },
        });
        return cats.map((c) => {
          const tr = c.translations.find((t) => t.locale === locale) ?? c.translations[0];
          return { id: c.id, slug: c.slug, name: tr?.name ?? c.slug, order: c.order };
        });
      },
      600,
    );
  }

  async listCategoriesAdmin(): Promise<
    Array<ProductCategory & { translations: ProductCategoryTranslation[] }>
  > {
    return this.prisma.productCategory.findMany({
      orderBy: { order: 'asc' },
      include: { translations: true },
    });
  }

  async createCategory(
    dto: CreateProductCategoryDto,
    userId: string,
  ): Promise<ProductCategory & { translations: ProductCategoryTranslation[] }> {
    const slug = await this.resolveCategorySlug(dto.slug, dto.translations);

    try {
      const created = await this.prisma.productCategory.create({
        data: {
          slug,
          order: dto.order ?? 0,
          translations: {
            create: dto.translations.map((t) => ({ locale: t.locale, name: t.name })),
          },
        },
        include: { translations: true },
      });

      await Promise.all([
        this.audit.record({
          userId,
          action: 'create',
          entityType: CATEGORY_ENTITY,
          entityId: created.id,
          newData: created,
        }),
        this.cache.invalidateNamespace(CATEGORY_CACHE_NS),
        this.cache.invalidateNamespace(CACHE_NS),
      ]);
      this.triggerProductRevalidation([]);

      return created;
    } catch (err) {
      this.handlePrismaError(err, 'category');
    }
  }

  async updateCategory(
    id: string,
    dto: UpdateProductCategoryDto,
    userId: string,
  ): Promise<ProductCategory & { translations: ProductCategoryTranslation[] }> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);

    const data: Prisma.ProductCategoryUpdateInput = {};
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.slug !== undefined) data.slug = normalizeSlug(dto.slug);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const cat = await tx.productCategory.update({ where: { id }, data });

        if (dto.translations) {
          for (const t of dto.translations) {
            await tx.productCategoryTranslation.upsert({
              where: { categoryId_locale: { categoryId: id, locale: t.locale } },
              create: { categoryId: id, locale: t.locale, name: t.name },
              update: { name: t.name },
            });
          }
        }

        return tx.productCategory.findUniqueOrThrow({
          where: { id: cat.id },
          include: { translations: true },
        });
      });

      await Promise.all([
        this.audit.record({
          userId,
          action: 'update',
          entityType: CATEGORY_ENTITY,
          entityId: id,
          oldData: existing,
          newData: updated,
        }),
        this.cache.invalidateNamespace(CATEGORY_CACHE_NS),
        this.cache.invalidateNamespace(CACHE_NS),
      ]);
      this.triggerProductRevalidation([]);

      return updated;
    } catch (err) {
      this.handlePrismaError(err, 'category');
    }
  }

  async deleteCategory(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { translations: true, products: { select: { id: true } } },
    });
    if (!existing) throw new NotFoundException(`Category ${id} not found`);

    if (existing.products.length > 0) {
      throw new ConflictException(
        `Category has ${existing.products.length} product(s). Reassign or delete them first.`,
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'delete',
        entityType: CATEGORY_ENTITY,
        entityId: id,
        oldData: existing,
      }),
      this.cache.invalidateNamespace(CATEGORY_CACHE_NS),
      this.cache.invalidateNamespace(CACHE_NS),
    ]);
    this.triggerProductRevalidation([]);

    return { id };
  }

  // ──────────────────────────────────────
  // PRODUCTS — PUBLIC
  // ──────────────────────────────────────

  async listPublic(query: PublicProductQueryDto): Promise<PublicListItem[]> {
    const locale = (query.locale ?? 'en') as Locale;
    const categoryKey = query.categorySlug ? `cat:${query.categorySlug}` : 'all';
    const kindKey = query.kind ?? 'all';
    const cacheKey = `${CACHE_NS}:list:${locale}:${categoryKey}:${kindKey}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.ProductWhereInput = {
          status: ContentStatus.published,
          publishedAt: { lte: new Date() },
        };
        if (query.categorySlug) {
          where.category = { slug: query.categorySlug };
        }
        if (query.kind) {
          where.kind = query.kind;
        }

        const rows = await this.prisma.product.findMany({
          where,
          orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
          include: {
            category: { include: { translations: true } },
            translations: true,
          },
        });

        return rows
          .map((p): PublicListItem | null => this.toPublicListItem(p, locale))
          .filter((item): item is PublicListItem => item !== null);
      },
      300,
    );
  }

  async findBySlugPublic(slug: string, locale: Locale): Promise<PublicProductDetail> {
    const cacheKey = `${CACHE_NS}:slug:${slug}:${locale}`;
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const product = await this.prisma.product.findUnique({
          where: { slug },
          include: {
            category: { include: { translations: true } },
            translations: true,
          },
        });

        if (
          !product ||
          product.status !== ContentStatus.published ||
          (product.publishedAt && product.publishedAt > new Date())
        ) {
          throw new NotFoundException(`Product "${slug}" not found`);
        }

        const detail = this.toPublicDetail(product, locale);
        if (!detail) {
          throw new NotFoundException(`Product "${slug}" not available in locale "${locale}"`);
        }
        return detail;
      },
      300,
    );
  }

  // ──────────────────────────────────────
  // PRODUCTS — ADMIN CRUD
  // ──────────────────────────────────────

  async listAdmin(query: AdminProductQueryDto): Promise<{
    items: ProductWithRelations[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { slug: { contains: query.search, mode: 'insensitive' } },
        { translations: { some: { title: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { include: { translations: true } },
          translations: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findByIdAdmin(id: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { include: { translations: true } },
        translations: true,
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto, userId: string): Promise<ProductWithRelations> {
    this.assertHasEnglishTranslation(dto.translations);
    const slug = await this.resolveProductSlug(dto.slug, dto.translations);

    if (dto.categoryId) {
      const cat = await this.prisma.productCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException(`Category ${dto.categoryId} not found`);
    }

    const status = dto.status ?? ContentStatus.draft;
    const publishedAt = status === ContentStatus.published ? new Date() : null;
    const scheduledAt = this.parseScheduledAt(dto.scheduledAt, status);

    try {
      const created = await this.prisma.product.create({
        data: {
          slug,
          kind: dto.kind ?? ProductKind.product,
          categoryId: dto.categoryId,
          status,
          publishedAt,
          scheduledAt,
          order: dto.order ?? 0,
          translations: { create: dto.translations.map((t) => this.translationCreatePayload(t)) },
        },
        include: {
          category: { include: { translations: true } },
          translations: true,
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
        this.audit.snapshot({
          entityType: ENTITY_TYPE,
          entityId: created.id,
          data: created,
          userId,
        }),
        this.invalidateProductCaches(created.slug),
      ]);

      return created;
    } catch (err) {
      this.handlePrismaError(err, 'product');
    }
  }

  async update(id: string, dto: UpdateProductDto, userId: string): Promise<ProductWithRelations> {
    const existing = await this.findByIdAdmin(id);

    if (dto.categoryId !== undefined) {
      const cat = await this.prisma.productCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException(`Category ${dto.categoryId} not found`);
    }

    const data: Prisma.ProductUpdateInput = {};

    if (dto.slug !== undefined) data.slug = normalizeSlug(dto.slug);
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.kind !== undefined) data.kind = dto.kind;

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === ContentStatus.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
      if (dto.status !== ContentStatus.scheduled) {
        data.scheduledAt = null;
      }
    }
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = this.parseScheduledAt(dto.scheduledAt, dto.status ?? existing.status);
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data });

        if (dto.translations) {
          for (const t of dto.translations) {
            await tx.productTranslation.upsert({
              where: { productId_locale: { productId: id, locale: t.locale } },
              create: { productId: id, ...this.translationCreatePayload(t) },
              update: this.translationUpdatePayload(t),
            });
          }
        }

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: {
            category: { include: { translations: true } },
            translations: true,
          },
        });
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
        this.audit.snapshot({
          entityType: ENTITY_TYPE,
          entityId: id,
          data: updated,
          userId,
        }),
        this.invalidateProductCaches(updated.slug, existing.slug),
      ]);

      return updated;
    } catch (err) {
      this.handlePrismaError(err, 'product');
    }
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findByIdAdmin(id);
    await this.prisma.product.delete({ where: { id } });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'delete',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
      }),
      this.invalidateProductCaches(existing.slug),
    ]);
    return { id };
  }

  async publish(id: string, userId: string): Promise<ProductWithRelations> {
    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ContentStatus.published,
        publishedAt: existing.publishedAt ?? new Date(),
        scheduledAt: null,
      },
      include: {
        category: { include: { translations: true } },
        translations: true,
      },
    });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'publish',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
        newData: updated,
      }),
      this.invalidateProductCaches(updated.slug),
    ]);
    return updated;
  }

  async unpublish(id: string, userId: string): Promise<ProductWithRelations> {
    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ContentStatus.draft, scheduledAt: null },
      include: {
        category: { include: { translations: true } },
        translations: true,
      },
    });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'unpublish',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
        newData: updated,
      }),
      this.invalidateProductCaches(updated.slug),
    ]);
    return updated;
  }

  async schedule(id: string, scheduledAt: string, userId: string): Promise<ProductWithRelations> {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('scheduledAt geçerli bir tarih değil');
    }
    if (date <= new Date()) {
      throw new BadRequestException('scheduledAt gelecekte olmalı');
    }

    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ContentStatus.scheduled, scheduledAt: date, publishedAt: null },
      include: {
        category: { include: { translations: true } },
        translations: true,
      },
    });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'schedule',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
        newData: updated,
      }),
      this.invalidateProductCaches(updated.slug),
    ]);
    return updated;
  }

  async listVersions(
    id: string,
  ): Promise<Array<{ version: number; createdAt: Date; createdBy: string | null }>> {
    await this.findByIdAdmin(id);
    return this.audit.listVersions(ENTITY_TYPE, id);
  }

  // ──────────────────────────────────────
  // INTERNAL HELPERS
  // ──────────────────────────────────────

  private translationCreatePayload(
    t: ProductTranslationInput,
  ): Prisma.ProductTranslationCreateWithoutProductInput {
    return {
      locale: t.locale,
      title: t.title,
      shortDescription: t.shortDescription,
      solution: t.solution as Prisma.InputJsonValue | undefined,
      howItWorks: t.howItWorks as Prisma.InputJsonValue | undefined,
      keyBenefits: t.keyBenefits as Prisma.InputJsonValue | undefined,
      productFamily: t.productFamily as Prisma.InputJsonValue | undefined,
      videos: t.videos as Prisma.InputJsonValue | undefined,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
      canonicalUrl: t.canonicalUrl,
      ogImage: t.ogImage,
      noIndex: t.noIndex ?? false,
      structuredData: t.structuredData as Prisma.InputJsonValue | undefined,
    };
  }

  private translationUpdatePayload(
    t: ProductTranslationInput,
  ): Prisma.ProductTranslationUpdateInput {
    return {
      title: t.title,
      shortDescription: t.shortDescription,
      solution: t.solution as Prisma.InputJsonValue | undefined,
      howItWorks: t.howItWorks as Prisma.InputJsonValue | undefined,
      keyBenefits: t.keyBenefits as Prisma.InputJsonValue | undefined,
      productFamily: t.productFamily as Prisma.InputJsonValue | undefined,
      videos: t.videos as Prisma.InputJsonValue | undefined,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
      canonicalUrl: t.canonicalUrl,
      ogImage: t.ogImage,
      noIndex: t.noIndex,
      structuredData: t.structuredData as Prisma.InputJsonValue | undefined,
    };
  }

  private toPublicListItem(p: ProductWithRelations, locale: Locale): PublicListItem | null {
    const tr = this.pickTranslation(p.translations, locale);
    if (!tr) return null;
    const catTr = this.pickCategoryTranslation(p.category?.translations ?? [], locale);
    return {
      id: p.id,
      slug: p.slug,
      order: p.order,
      publishedAt: p.publishedAt,
      category: p.category ? { slug: p.category.slug, name: catTr?.name ?? p.category.slug } : null,
      title: tr.title,
      shortDescription: tr.shortDescription,
      ogImage: tr.ogImage,
    };
  }

  private toPublicDetail(p: ProductWithRelations, locale: Locale): PublicProductDetail | null {
    const base = this.toPublicListItem(p, locale);
    if (!base) return null;
    const tr = this.pickTranslation(p.translations, locale);
    if (!tr) return null;
    return {
      ...base,
      solution: tr.solution,
      howItWorks: tr.howItWorks,
      keyBenefits: tr.keyBenefits,
      productFamily: tr.productFamily,
      videos: tr.videos,
      metaTitle: tr.metaTitle,
      metaDescription: tr.metaDescription,
      canonicalUrl: tr.canonicalUrl,
      noIndex: tr.noIndex,
      structuredData: tr.structuredData,
    };
  }

  private pickTranslation(
    translations: ProductTranslation[],
    locale: Locale,
  ): ProductTranslation | undefined {
    return translations.find((t) => t.locale === locale)
      ?? translations.find((t) => t.locale === 'en')
      ?? translations[0];
  }

  private pickCategoryTranslation(
    translations: ProductCategoryTranslation[],
    locale: Locale,
  ): ProductCategoryTranslation | undefined {
    return translations.find((t) => t.locale === locale)
      ?? translations.find((t) => t.locale === 'en')
      ?? translations[0];
  }

  private async resolveProductSlug(
    requested: string | undefined,
    translations: ProductTranslationInput[],
  ): Promise<string> {
    const seed =
      requested ?? translations.find((t) => t.locale === 'en')?.title ?? translations[0]?.title;
    const slug = normalizeSlug(seed ?? '');
    if (!slug) throw new BadRequestException('Slug üretilemedi (boş input)');

    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" zaten kullanımda`);
    }
    return slug;
  }

  private async resolveCategorySlug(
    requested: string | undefined,
    translations: ProductCategoryTranslationInput[],
  ): Promise<string> {
    const seed =
      requested ?? translations.find((t) => t.locale === 'en')?.name ?? translations[0]?.name;
    const slug = normalizeSlug(seed ?? '');
    if (!slug) throw new BadRequestException('Slug üretilemedi (boş input)');

    const existing = await this.prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Category slug "${slug}" zaten kullanımda`);
    }
    return slug;
  }

  private parseScheduledAt(value: string | undefined, status: ContentStatus): Date | null {
    if (status !== ContentStatus.scheduled) return null;
    if (!value) {
      throw new BadRequestException('scheduled status için scheduledAt zorunlu');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('scheduledAt geçerli bir tarih değil');
    }
    if (date <= new Date()) {
      throw new BadRequestException('scheduledAt gelecekte olmalı');
    }
    return date;
  }

  private assertHasEnglishTranslation(translations: ProductTranslationInput[]): void {
    if (!translations.some((t) => t.locale === 'en')) {
      throw new BadRequestException('EN translation zorunludur (varsayılan dil; TR opsiyoneldir).');
    }
  }

  private async invalidateProductCaches(...slugs: string[]): Promise<void> {
    await this.cache.invalidateNamespace(CACHE_NS);
    if (slugs.length > 0) {
      this.logger.debug(`Invalidated product caches (slugs: ${slugs.join(', ')})`);
    }
    this.triggerProductRevalidation(slugs);
  }

  /**
   * Frontend ISR revalidation — fire-and-forget.
   * Unique slug'lar için her locale path'i tetiklenir. Tag olarak `products` +
   * `sitemap` (sitemap'te slug değiştiği için). Sitemap cache'i de bu servis
   * üzerinden invalidate edilir.
   */
  private triggerProductRevalidation(slugs: string[]): void {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    const paths = unique.flatMap((s) => [`/en/products/${s}`, `/tr/products/${s}`]);
    void this.cache.invalidateNamespace('sitemap').catch(() => undefined);
    void this.revalidation
      .revalidate({ tags: ['products', 'sitemap'], paths })
      .catch(() => undefined);
  }

  private handlePrismaError(err: unknown, label: string): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new ConflictException(`${label}: unique constraint violation`);
      }
      if (err.code === 'P2025') {
        throw new NotFoundException(`${label}: kayıt bulunamadı`);
      }
    }
    throw err as Error;
  }
}
