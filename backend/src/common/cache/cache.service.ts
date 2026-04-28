import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Modüllerin Redis cache'i tutarlı namespace ile kullanmasını sağlar.
 *
 * Anahtar formatı:  `<namespace>:<entity>:<...parts>`
 *   örnek: products:list:en:cat:pam
 *          products:slug:kron-pam:en
 *          blog:list:tr
 *
 * Invalidation: `invalidateNamespace('products')` →
 *   tüm `products:*` keyleri silinir (write sonrası çağırılır).
 *
 * Not: RedisService zaten JSON.stringify/parse yapıyor; biz sadece namespacing
 * ve "getOrSet" pattern'i ekliyoruz.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtlSec = 300; // 5 dk

  constructor(private readonly redis: RedisService) {}

  /** Cache'den dön; yoksa loader'ı çalıştır, sonucu sakla, döndür. */
  async getOrSet<T>(key: string, loader: () => Promise<T>, ttlSec?: number): Promise<T> {
    const cached = await this.redis.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await loader();
    await this.set(key, fresh, ttlSec);
    return fresh;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    await this.redis.set(key, value, ttlSec ?? this.defaultTtlSec);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Bir namespace'e ait TÜM cache'leri sil.
   * Redis SCAN kullanır → KEYS gibi blocking değil, üretimde de güvenli.
   */
  async invalidateNamespace(namespace: string): Promise<number> {
    const pattern = `${namespace}:*`;
    const removed = await this.redis.delPattern(pattern);
    if (removed > 0) {
      this.logger.log(`Invalidated ${removed} cache key(s) for namespace="${namespace}"`);
    }
    return removed;
  }

  /** Çoklu namespace invalidation (örn. publish sonrası: products + sitemap). */
  async invalidateNamespaces(namespaces: string[]): Promise<void> {
    await Promise.all(namespaces.map((ns) => this.invalidateNamespace(ns)));
  }
}
