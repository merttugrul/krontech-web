import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

const CACHE_NS = 'sitemap';

/**
 * Bir URL, Google sitemap spec'ine göre.
 * lastmod → ISO 8601. changefreq/priority opsiyonel ama SEO'ya yarar.
 */
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const SITEMAP_LOCALES = ['en', 'tr'] as const;
export type SitemapLocale = (typeof SITEMAP_LOCALES)[number];

/**
 * Statik sayfalar — multi-locale yayınlanır.
 * Her satır: path (locale prefix'siz), changefreq, priority.
 */
const STATIC_PAGES: Array<{
  path: string;
  changefreq: SitemapUrl['changefreq'];
  priority: number;
}> = [
  { path: '', changefreq: 'daily', priority: 1.0 }, // home
  { path: 'products', changefreq: 'weekly', priority: 0.9 },
  { path: 'blog', changefreq: 'daily', priority: 0.8 },
  { path: 'resources', changefreq: 'weekly', priority: 0.7 },
  { path: 'about', changefreq: 'monthly', priority: 0.5 },
  { path: 'contact', changefreq: 'monthly', priority: 0.5 },
];

@Injectable()
export class SitemapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Tam sitemap XML'ini döner. Cache'li (1 saat). Cache key tek — sitemap her
   * locale için tek dosya içinde; Next.js frontend path-based routing yapacak.
   */
  async buildXml(): Promise<string> {
    return this.cache.getOrSet(
      `${CACHE_NS}:xml:v1`,
      async () => {
        const urls = await this.collectUrls();
        return this.renderXml(urls);
      },
      3600,
    );
  }

  /**
   * Test/dev için JSON sürüm — sitemap içeriğini XML parse etmeden doğrulamayı kolaylaştırır.
   */
  async collectUrls(): Promise<SitemapUrl[]> {
    const baseUrl = this.getBaseUrl();
    const urls: SitemapUrl[] = [];
    const now = new Date().toISOString();

    // Statik sayfalar × her locale
    for (const locale of SITEMAP_LOCALES) {
      for (const page of STATIC_PAGES) {
        urls.push({
          loc: this.joinUrl(baseUrl, locale, page.path),
          lastmod: now,
          changefreq: page.changefreq,
          priority: page.priority,
        });
      }
    }

    // Published products (sadece publishedAt <= now)
    const products = await this.prisma.product.findMany({
      where: {
        status: ContentStatus.published,
        publishedAt: { lte: new Date() },
      },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    for (const locale of SITEMAP_LOCALES) {
      for (const p of products) {
        urls.push({
          loc: this.joinUrl(baseUrl, locale, `products/${p.slug}`),
          lastmod: (p.updatedAt ?? p.publishedAt ?? new Date()).toISOString(),
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Published blog posts
    const posts = await this.prisma.blogPost.findMany({
      where: {
        status: ContentStatus.published,
        publishedAt: { lte: new Date() },
      },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
    for (const locale of SITEMAP_LOCALES) {
      for (const post of posts) {
        urls.push({
          loc: this.joinUrl(baseUrl, locale, `blog/${post.slug}`),
          lastmod: (post.updatedAt ?? post.publishedAt ?? new Date()).toISOString(),
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Published resources (locale kolonlu model — her kayıt tek locale)
    const resources = await this.prisma.resource.findMany({
      where: { status: ContentStatus.published },
      select: { id: true, locale: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    for (const r of resources) {
      urls.push({
        loc: this.joinUrl(baseUrl, r.locale, `resources/${r.id}`),
        lastmod: r.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority: 0.5,
      });
    }

    return urls;
  }

  /**
   * Cache manuel invalidate (içerik modülleri yayınlama sonrası çağırır).
   */
  async invalidate(): Promise<void> {
    await this.cache.invalidateNamespace(CACHE_NS);
  }

  // ──────────────────────────────────────
  // PRIVATE
  // ──────────────────────────────────────

  private getBaseUrl(): string {
    const fromEnv = this.config.get<string>('NEXT_PUBLIC_SITE_URL');
    return (fromEnv ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private joinUrl(base: string, locale: string, path: string): string {
    const cleanPath = path.replace(/^\/+/, '');
    if (cleanPath === '') return `${base}/${locale}`;
    return `${base}/${locale}/${cleanPath}`;
  }

  private renderXml(urls: SitemapUrl[]): string {
    const body = urls
      .map((u) => {
        const parts = [`    <loc>${this.escapeXml(u.loc)}</loc>`];
        if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
        if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
        if (u.priority !== undefined) {
          parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
        }
        return `  <url>\n${parts.join('\n')}\n  </url>`;
      })
      .join('\n');

    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      body +
      '\n</urlset>\n'
    );
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
