import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { RevalidationService } from '../revalidation/revalidation.service';

/**
 * Scheduled publish runner.
 *
 * Her dakika çalışır; `status=scheduled && scheduledAt <= now` olan
 * Product/BlogPost kayıtlarını `published`'a geçirir, `publishedAt`'ı set eder,
 * `scheduledAt`'ı null'lar.
 *
 * Neden cron? Publish zamanı geldiğinde kullanıcıya "1 dk içinde canlı olur"
 * SLA'sı vermek istiyoruz. Exact-time precision gerekmiyor (editorial content).
 *
 * Kaç iş bir anda? Pratikte aynı dakikada 1000 içerik planlanması nadir → full
 * in-place transition güvenli. Yine de hata tolere etmek için her item ayrı
 * try/catch ile işlenir; bir item'ın failure'ı diğerlerini etkilemesin.
 */

export interface ScheduledPublishResult {
  productsPublished: number;
  blogPostsPublished: number;
  failed: number;
}

const SYSTEM_USER_ID = '__scheduler__';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  /**
   * Her dakika başı tetiklenir.
   *
   * Test ortamında ScheduleModule'ın @Cron kayıtları da çalışır (çünkü
   * ScheduleModule.forRoot çağrısı AppModule'da). Gereksiz log bırakmamak için
   * NODE_ENV=test ise skip ediyoruz.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'publish-scheduled-content' })
  async handlePublishScheduled(): Promise<ScheduledPublishResult | void> {
    if (process.env.NODE_ENV === 'test') return;
    return this.publishScheduled();
  }

  /**
   * Ana transition mantığı. Cron dışı (ör. unit test veya manuel tetikleme)
   * çağrılabilsin diye public.
   */
  async publishScheduled(now: Date = new Date()): Promise<ScheduledPublishResult> {
    const result: ScheduledPublishResult = {
      productsPublished: 0,
      blogPostsPublished: 0,
      failed: 0,
    };

    const [productsDue, blogDue] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: ContentStatus.scheduled, scheduledAt: { lte: now } },
        select: { id: true, slug: true, publishedAt: true, scheduledAt: true },
      }),
      this.prisma.blogPost.findMany({
        where: { status: ContentStatus.scheduled, scheduledAt: { lte: now } },
        select: { id: true, slug: true, publishedAt: true, scheduledAt: true },
      }),
    ]);

    for (const p of productsDue) {
      try {
        const updated = await this.prisma.product.update({
          where: { id: p.id },
          data: {
            status: ContentStatus.published,
            publishedAt: p.publishedAt ?? now,
            scheduledAt: null,
          },
        });
        await this.audit.record({
          action: 'publish',
          entityType: 'Product',
          entityId: p.id,
          oldData: { ...p, source: SYSTEM_USER_ID },
          newData: updated,
        });
        result.productsPublished++;
      } catch (err) {
        this.logger.error(
          `Scheduled publish FAILED for Product ${p.id}: ${err instanceof Error ? err.message : err}`,
        );
        result.failed++;
      }
    }

    for (const b of blogDue) {
      try {
        const updated = await this.prisma.blogPost.update({
          where: { id: b.id },
          data: {
            status: ContentStatus.published,
            publishedAt: b.publishedAt ?? now,
            scheduledAt: null,
          },
        });
        await this.audit.record({
          action: 'publish',
          entityType: 'BlogPost',
          entityId: b.id,
          oldData: { ...b, source: SYSTEM_USER_ID },
          newData: updated,
        });
        result.blogPostsPublished++;
      } catch (err) {
        this.logger.error(
          `Scheduled publish FAILED for BlogPost ${b.id}: ${err instanceof Error ? err.message : err}`,
        );
        result.failed++;
      }
    }

    const total = result.productsPublished + result.blogPostsPublished;
    if (total > 0) {
      this.logger.log(
        `[scheduler] published ${result.productsPublished} products, ${result.blogPostsPublished} blog posts, ${result.failed} failed`,
      );

      // Cache + frontend revalidation
      const cacheJobs: Promise<unknown>[] = [];
      const tags: string[] = [];
      const paths: string[] = [];

      if (result.productsPublished > 0) {
        cacheJobs.push(this.cache.invalidateNamespace('products'));
        tags.push('products');
        for (const p of productsDue) paths.push(`/products/${p.slug}`);
      }
      if (result.blogPostsPublished > 0) {
        cacheJobs.push(this.cache.invalidateNamespace('blog'));
        tags.push('blog');
        for (const b of blogDue) paths.push(`/blog/${b.slug}`);
      }
      // Sitemap her durumda güncellenmeli
      tags.push('sitemap');
      cacheJobs.push(this.cache.invalidateNamespace('sitemap'));

      await Promise.all(cacheJobs);
      await this.revalidation.revalidate({ tags, paths });
    }

    return result;
  }
}
