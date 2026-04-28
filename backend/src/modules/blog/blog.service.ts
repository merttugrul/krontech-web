import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BlogPost, BlogPostTranslation, ContentStatus, PostType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { RevalidationService } from '../../common/revalidation/revalidation.service';
import { normalizeSlug } from '../../common/utils/slug.util';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { AdminBlogQueryDto, PublicBlogQueryDto } from './dto/query-blog-post.dto';
import { BlogTranslationInput, FaqItemInput, Locale } from './dto/blog-translation.dto';

const ENTITY_TYPE = 'BlogPost';
const CACHE_NS = 'blog';

type BlogWithRelations = BlogPost & {
  translations: BlogPostTranslation[];
  author: { id: string; email: string; role: string } | null;
};

export interface PublicBlogListItem {
  id: string;
  slug: string;
  type: PostType;
  coverImage: string | null;
  publishedAt: Date | null;
  isHighlight: boolean;
  viewCount: number;
  author: { id: string; email: string } | null;
  title: string;
  excerpt: string;
  ogImage: string | null;
}

export interface PublicBlogDetail extends PublicBlogListItem {
  content: string;
  faqItems: FaqItemInput[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
}

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ──────────────────────────────────────
  // PUBLIC
  // ──────────────────────────────────────

  async listPublic(query: PublicBlogQueryDto): Promise<{
    items: PublicBlogListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const locale = (query.locale ?? 'en') as Locale;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const highlightKey = query.isHighlight === undefined ? 'any' : String(query.isHighlight);
    const cacheKey = `${CACHE_NS}:list:${locale}:${query.type ?? 'all'}:hl=${highlightKey}:p=${page}:ps=${pageSize}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.BlogPostWhereInput = {
          status: ContentStatus.published,
          publishedAt: { lte: new Date() },
        };
        if (query.type) where.type = query.type;
        if (query.isHighlight !== undefined) where.isHighlight = query.isHighlight;

        const [rows, total] = await Promise.all([
          this.prisma.blogPost.findMany({
            where,
            orderBy: [{ isHighlight: 'desc' }, { publishedAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
              translations: true,
              author: { select: { id: true, email: true, role: true } },
            },
          }),
          this.prisma.blogPost.count({ where }),
        ]);

        const items = rows
          .map((p): PublicBlogListItem | null => this.toPublicListItem(p, locale))
          .filter((i): i is PublicBlogListItem => i !== null);

        return { items, total, page, pageSize };
      },
      300,
    );
  }

  async findBySlugPublic(slug: string, locale: Locale): Promise<PublicBlogDetail> {
    const cacheKey = `${CACHE_NS}:slug:${slug}:${locale}`;

    const detail = await this.cache.getOrSet(
      cacheKey,
      async () => {
        const post = await this.prisma.blogPost.findUnique({
          where: { slug },
          include: {
            translations: true,
            author: { select: { id: true, email: true, role: true } },
          },
        });

        if (
          !post ||
          post.status !== ContentStatus.published ||
          (post.publishedAt && post.publishedAt > new Date())
        ) {
          throw new NotFoundException(`Blog post "${slug}" not found`);
        }

        const d = this.toPublicDetail(post, locale);
        if (!d) {
          throw new NotFoundException(`Blog post "${slug}" not available in locale "${locale}"`);
        }
        return d;
      },
      300,
    );

    // Fire-and-forget view count increment (cache'ten bağımsız: her HTTP isteği sayılır).
    // Hata olursa log'la, kullanıcıyı etkileme.
    this.prisma.blogPost
      .update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err: unknown) => {
        this.logger.warn(`viewCount increment başarısız (${slug}): ${(err as Error).message}`);
      });

    return detail;
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async listAdmin(query: AdminBlogQueryDto): Promise<{
    items: BlogWithRelations[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.BlogPostWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { slug: { contains: query.search, mode: 'insensitive' } },
        {
          translations: {
            some: { title: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          translations: true,
          author: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    // Admin listesi: tüm status'lar (draft, published, scheduled) — `where.status` sadece query.status verilirse set edilir.
    const items = rows.map((p) => {
      const t = this.pickTranslation(p.translations, 'en');
      return { ...(p as BlogWithRelations), title: t?.title ?? '' };
    });

    return { items, total, page, pageSize };
  }

  async findByIdAdmin(id: string): Promise<BlogWithRelations> {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
        author: { select: { id: true, email: true, role: true } },
      },
    });
    if (!post) throw new NotFoundException(`Blog post ${id} not found`);
    return post as BlogWithRelations;
  }

  async create(dto: CreateBlogPostDto, userId: string): Promise<BlogWithRelations> {
    const slug = await this.resolveSlug(dto.slug, dto.translations, dto.primaryLocale);

    // authorId verilmezse request sahibini yazar olarak set et.
    // Verildiyse user'ın var olduğunu doğrula.
    const authorId = dto.authorId ?? userId;
    const authorExists = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!authorExists) {
      throw new BadRequestException(`Author ${authorId} not found`);
    }

    const status = dto.status ?? ContentStatus.draft;
    const publishedAt = status === ContentStatus.published ? new Date() : null;
    const scheduledAt = this.parseScheduledAt(dto.scheduledAt, status);

    try {
      const created = await this.prisma.blogPost.create({
        data: {
          slug,
          type: dto.type ?? PostType.blog,
          authorId,
          coverImage: dto.coverImage,
          status,
          publishedAt,
          scheduledAt,
          isHighlight: dto.isHighlight ?? false,
          translations: {
            create: dto.translations.map((t) => this.translationCreatePayload(t)),
          },
        },
        include: {
          translations: true,
          author: { select: { id: true, email: true, role: true } },
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
        this.invalidateCaches(created.slug),
      ]);

      return created as BlogWithRelations;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async update(id: string, dto: UpdateBlogPostDto, userId: string): Promise<BlogWithRelations> {
    const existing = await this.findByIdAdmin(id);

    if (dto.authorId !== undefined) {
      const authorExists = await this.prisma.user.findUnique({ where: { id: dto.authorId } });
      if (!authorExists) {
        throw new BadRequestException(`Author ${dto.authorId} not found`);
      }
    }

    const data: Prisma.BlogPostUpdateInput = {};

    if (dto.slug !== undefined) data.slug = normalizeSlug(dto.slug);
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.authorId !== undefined) data.author = { connect: { id: dto.authorId } };
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.isHighlight !== undefined) data.isHighlight = dto.isHighlight;

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
        await tx.blogPost.update({ where: { id }, data });

        if (dto.translations) {
          for (const t of dto.translations) {
            await tx.blogPostTranslation.upsert({
              where: { blogPostId_locale: { blogPostId: id, locale: t.locale } },
              create: { blogPostId: id, ...this.translationCreatePayload(t) },
              update: this.translationUpdatePayload(t),
            });
          }
        }

        return tx.blogPost.findUniqueOrThrow({
          where: { id },
          include: {
            translations: true,
            author: { select: { id: true, email: true, role: true } },
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
        this.invalidateCaches(updated.slug, existing.slug),
      ]);

      return updated as BlogWithRelations;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async delete(id: string, userId: string): Promise<{ id: string }> {
    const existing = await this.findByIdAdmin(id);
    await this.prisma.blogPost.delete({ where: { id } });
    await Promise.all([
      this.audit.record({
        userId,
        action: 'delete',
        entityType: ENTITY_TYPE,
        entityId: id,
        oldData: existing,
      }),
      this.invalidateCaches(existing.slug),
    ]);
    return { id };
  }

  async publish(id: string, userId: string): Promise<BlogWithRelations> {
    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: ContentStatus.published,
        publishedAt: existing.publishedAt ?? new Date(),
        scheduledAt: null,
      },
      include: {
        translations: true,
        author: { select: { id: true, email: true, role: true } },
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
      this.invalidateCaches(updated.slug),
    ]);
    return updated as BlogWithRelations;
  }

  async unpublish(id: string, userId: string): Promise<BlogWithRelations> {
    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: { status: ContentStatus.draft, scheduledAt: null },
      include: {
        translations: true,
        author: { select: { id: true, email: true, role: true } },
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
      this.invalidateCaches(updated.slug),
    ]);
    return updated as BlogWithRelations;
  }

  async schedule(id: string, scheduledAt: string, userId: string): Promise<BlogWithRelations> {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('scheduledAt geçerli bir tarih değil');
    }
    if (date <= new Date()) {
      throw new BadRequestException('scheduledAt gelecekte olmalı');
    }

    const existing = await this.findByIdAdmin(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: ContentStatus.scheduled,
        scheduledAt: date,
        publishedAt: null,
      },
      include: {
        translations: true,
        author: { select: { id: true, email: true, role: true } },
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
      this.invalidateCaches(updated.slug),
    ]);
    return updated as BlogWithRelations;
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
    t: BlogTranslationInput,
  ): Prisma.BlogPostTranslationCreateWithoutBlogPostInput {
    return {
      locale: t.locale,
      title: t.title,
      excerpt: t.excerpt,
      content: t.content,
      faqItems: (t.faqItems as unknown as Prisma.InputJsonValue) ?? undefined,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
      canonicalUrl: t.canonicalUrl,
      ogImage: t.ogImage,
      noIndex: t.noIndex ?? false,
    };
  }

  private translationUpdatePayload(t: BlogTranslationInput): Prisma.BlogPostTranslationUpdateInput {
    return {
      title: t.title,
      excerpt: t.excerpt,
      content: t.content,
      faqItems: (t.faqItems as unknown as Prisma.InputJsonValue) ?? undefined,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
      canonicalUrl: t.canonicalUrl,
      ogImage: t.ogImage,
      noIndex: t.noIndex,
    };
  }

  private toPublicListItem(
    p: BlogPost & {
      translations: BlogPostTranslation[];
      author: { id: string; email: string; role: string } | null;
    },
    locale: Locale,
  ): PublicBlogListItem | null {
    const tr = this.pickTranslation(p.translations, locale);
    if (!tr) return null;
    return {
      id: p.id,
      slug: p.slug,
      type: p.type,
      coverImage: p.coverImage,
      publishedAt: p.publishedAt,
      isHighlight: p.isHighlight,
      viewCount: p.viewCount,
      author: p.author ? { id: p.author.id, email: p.author.email } : null,
      title: tr.title,
      excerpt: tr.excerpt,
      ogImage: tr.ogImage,
    };
  }

  private toPublicDetail(
    p: BlogPost & {
      translations: BlogPostTranslation[];
      author: { id: string; email: string; role: string } | null;
    },
    locale: Locale,
  ): PublicBlogDetail | null {
    const base = this.toPublicListItem(p, locale);
    if (!base) return null;
    const tr = this.pickTranslation(p.translations, locale);
    if (!tr) return null;
    return {
      ...base,
      content: tr.content,
      faqItems: (tr.faqItems as unknown as FaqItemInput[] | null) ?? null,
      metaTitle: tr.metaTitle,
      metaDescription: tr.metaDescription,
      canonicalUrl: tr.canonicalUrl,
      noIndex: tr.noIndex,
    };
  }

  private pickTranslation(
    translations: BlogPostTranslation[],
    locale: Locale,
  ): BlogPostTranslation | undefined {
    return (
      translations.find((t) => t.locale === locale) ??
      translations.find((t) => t.locale === 'en') ??
      translations[0]
    );
  }

  private async resolveSlug(
    requested: string | undefined,
    translations: BlogTranslationInput[],
    primaryLocale?: Locale,
  ): Promise<string> {
    const fromPrimary =
      primaryLocale != null
        ? translations.find((t) => t.locale === primaryLocale)?.title?.trim()
        : undefined;
    const seed =
      requested?.trim() ||
      (fromPrimary && fromPrimary.length > 0 ? fromPrimary : undefined) ||
      translations.find((t) => t.locale === 'en')?.title?.trim() ||
      translations[0]?.title?.trim() ||
      '';
    const slug = normalizeSlug(seed);
    if (!slug) throw new BadRequestException('Slug üretilemedi (boş input)');

    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" zaten kullanımda`);
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

  private async invalidateCaches(...slugs: string[]): Promise<void> {
    await this.cache.invalidateNamespace(CACHE_NS);
    if (slugs.length > 0) {
      this.logger.debug(`Invalidated blog caches (slugs: ${slugs.join(', ')})`);
    }

    // Frontend ISR revalidation (fire-and-forget) + sitemap cache invalidate
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    const paths = unique.flatMap((s) => [`/en/blog/${s}`, `/tr/blog/${s}`]);
    void this.cache.invalidateNamespace('sitemap').catch(() => undefined);
    void this.revalidation.revalidate({ tags: ['blog', 'sitemap'], paths }).catch(() => undefined);
  }

  private handlePrismaError(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new ConflictException('blog: unique constraint violation');
      }
      if (err.code === 'P2025') {
        throw new NotFoundException('blog: kayıt bulunamadı');
      }
    }
    throw err as Error;
  }
}
