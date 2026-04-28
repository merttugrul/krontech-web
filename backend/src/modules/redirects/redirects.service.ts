import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Redirect } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { UpdateRedirectDto } from './dto/update-redirect.dto';
import { AdminRedirectQueryDto } from './dto/query-redirect.dto';

const ENTITY_TYPE = 'Redirect';
const CACHE_NS = 'redirects';

export interface RedirectLookupResult {
  toPath: string;
  statusCode: number;
}

@Injectable()
export class RedirectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  // ──────────────────────────────────────
  // PUBLIC — Next.js middleware tarafından kullanılır
  // ──────────────────────────────────────

  /**
   * Tek bir path için aktif redirect varsa döner; yoksa null.
   * Middleware her HTTP request'te çağıracak → agresif cache şart.
   * Negative cache (null) de kaydedilir ki her 404 için DB'ye gitmeyelim.
   */
  async lookup(fromPath: string): Promise<RedirectLookupResult | null> {
    const normalized = this.normalizePath(fromPath);
    const cacheKey = `${CACHE_NS}:lookup:${normalized}`;

    // Negative cache için "MISS" sentinel kullanıyoruz — null'ı değil.
    // getOrSet null döndürürse tekrar DB sorgular; bu yüzden özel pattern:
    const cached = await this.cache.get<RedirectLookupResult | 'NONE'>(cacheKey);
    if (cached === 'NONE') return null;
    if (cached) return cached;

    const redirect = await this.prisma.redirect.findUnique({
      where: { fromPath: normalized },
    });

    if (!redirect || !redirect.isActive) {
      await this.cache.set(cacheKey, 'NONE', 300);
      return null;
    }

    const result: RedirectLookupResult = {
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
    };
    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async list(query: AdminRedirectQueryDto): Promise<{
    items: Redirect[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const where: Prisma.RedirectWhereInput = {};
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { fromPath: { contains: query.search, mode: 'insensitive' } },
        { toPath: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.redirect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.redirect.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<Redirect> {
    const r = await this.prisma.redirect.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`Redirect ${id} not found`);
    return r;
  }

  async create(dto: CreateRedirectDto, userId: string): Promise<Redirect> {
    const fromPath = this.normalizePath(dto.fromPath);
    const toPath = this.normalizeToPath(dto.toPath);

    this.assertNoSelfLoop(fromPath, toPath);

    const existing = await this.prisma.redirect.findUnique({ where: { fromPath } });
    if (existing) {
      throw new ConflictException(`fromPath "${fromPath}" zaten kayıtlı`);
    }

    const created = await this.prisma.redirect.create({
      data: {
        fromPath,
        toPath,
        statusCode: dto.statusCode ?? 301,
        isActive: dto.isActive ?? true,
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

  async update(id: string, dto: UpdateRedirectDto, userId: string): Promise<Redirect> {
    const existing = await this.findById(id);

    const fromPath = dto.fromPath ? this.normalizePath(dto.fromPath) : existing.fromPath;
    const toPath = dto.toPath ? this.normalizeToPath(dto.toPath) : existing.toPath;

    this.assertNoSelfLoop(fromPath, toPath);

    // fromPath değişiyorsa duplicate kontrolü
    if (fromPath !== existing.fromPath) {
      const dup = await this.prisma.redirect.findUnique({ where: { fromPath } });
      if (dup) {
        throw new ConflictException(`fromPath "${fromPath}" zaten kayıtlı`);
      }
    }

    const updated = await this.prisma.redirect.update({
      where: { id },
      data: {
        fromPath,
        toPath,
        statusCode: dto.statusCode,
        isActive: dto.isActive,
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
    await this.prisma.redirect.delete({ where: { id } });

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

  /**
   * Trailing slash ve case normalize — lookup cache hit oranını yükseltir.
   * Cross-site etkisi yok; path comparison case-insensitive olsun istiyoruz ama
   * PostgreSQL default case-sensitive. Bu yüzden her şeyi lowercase saklamak
   * yerine sadece trailing slash'ı kaldırıyoruz (case'i olduğu gibi bırak).
   */
  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      throw new BadRequestException('Path "/" ile başlamalı');
    }
    if (path.length > 1 && path.endsWith('/')) {
      return path.replace(/\/+$/, '');
    }
    return path;
  }

  /**
   * toPath hem internal ("/yeni-sayfa") hem external ("https://example.com/x")
   * olabilir. External için normalize yapma — scheme/host'u korur.
   */
  private normalizeToPath(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.normalizePath(path);
  }

  private assertNoSelfLoop(fromPath: string, toPath: string): void {
    if (fromPath === toPath) {
      throw new BadRequestException('fromPath ve toPath aynı olamaz (redirect loop)');
    }
  }
}
