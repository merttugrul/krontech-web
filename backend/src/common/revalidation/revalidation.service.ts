import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Next.js ISR/on-demand revalidation tetikleyicisi.
 *
 * Sözleşme: frontend tarafında `POST /api/revalidate` endpoint'i bulunur ve
 * aşağıdaki body'yi bekler:
 *   { secret: "...", tags?: string[], paths?: string[] }
 *
 * Backend bir içerik yayınladığında ilgili tag/path'leri invalide etsin ki
 * kullanıcılar anında güncel sürümü görsün (ISR cache bypass).
 *
 * "Fire and forget": revalidation başarısız olursa ana iş (DB write) etkilenmez.
 * Sadece warn loglanır. Çünkü frontend geçici olarak down olabilir → bu yüzden
 * içerik yayınlanamasın tarzı bir bağımlılık kurmak istemeyiz.
 *
 * Test ortamında (NODE_ENV=test) veya site URL set edilmemişse no-op çalışır.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  private readonly siteUrl: string | undefined;
  private readonly secret: string;
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.siteUrl = this.config.get<string>('NEXT_PUBLIC_SITE_URL');
    this.secret = this.config.get<string>('REVALIDATION_SECRET', '');
    this.client = axios.create({ timeout: 3000 });
  }

  /**
   * Bir veya birden fazla cache tag'ını revalidate eder.
   * Tag örnekleri: "products", "blog", "resources", "sitemap".
   */
  async revalidateTags(tags: string[]): Promise<void> {
    if (tags.length === 0) return;
    await this.send({ tags });
  }

  /**
   * Belirli path(ler)i revalidate eder. Özellikle slug-bazlı sayfalar için:
   * `/products/my-product`, `/blog/my-post`.
   */
  async revalidatePaths(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await this.send({ paths });
  }

  /**
   * Tek çağrıda hem tag hem path. Yayınlama akışlarında tipik kullanım:
   *   revalidate({ tags: ['blog'], paths: ['/blog/my-post'] })
   */
  async revalidate(opts: { tags?: string[]; paths?: string[] }): Promise<void> {
    const payload: { tags?: string[]; paths?: string[] } = {};
    if (opts.tags?.length) payload.tags = opts.tags;
    if (opts.paths?.length) payload.paths = opts.paths;
    if (!payload.tags && !payload.paths) return;
    await this.send(payload);
  }

  // ──────────────────────────────────────
  // PRIVATE
  // ──────────────────────────────────────

  private async send(payload: { tags?: string[]; paths?: string[] }): Promise<void> {
    if (this.isTestEnv()) return;
    if (!this.siteUrl) {
      this.logger.debug('NEXT_PUBLIC_SITE_URL set edilmemiş — revalidation skip.');
      return;
    }
    if (!this.secret) {
      this.logger.warn('REVALIDATION_SECRET boş — revalidation skip.');
      return;
    }

    const url = `${this.siteUrl.replace(/\/$/, '')}/api/revalidate`;

    try {
      const res = await this.client.post(url, { ...payload, secret: this.secret });
      this.logger.debug(`Revalidate OK → ${JSON.stringify(payload)} (status ${res.status})`);
    } catch (err) {
      // Fire-and-forget felsefesi: hata atma, sadece warn logla.
      const msg = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(`Revalidate FAILED ${url} · payload=${JSON.stringify(payload)} · ${msg}`);
    }
  }

  private isTestEnv(): boolean {
    return this.config.get<string>('NODE_ENV') === 'test';
  }
}
