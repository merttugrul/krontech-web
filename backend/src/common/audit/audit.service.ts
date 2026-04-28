import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'schedule';

interface RecordParams {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
}

interface VersionParams {
  entityType: string;
  entityId: string;
  data: unknown;
  userId?: string;
}

/**
 * Tüm content modüllerinin (Products, Blog, Resources vs.) ortak audit ve
 * versiyonlama servisi. Her write operasyonundan sonra:
 *   - record()  → audit_logs tablosuna log
 *   - snapshot() → content_versions tablosuna versiyon (otomatik artan version no)
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldData: params.oldData as Prisma.InputJsonValue | undefined,
          newData: params.newData as Prisma.InputJsonValue | undefined,
          ipAddress: params.ipAddress,
        },
      });
    } catch (err) {
      // Audit logging asla ana akışı durdurmamalı — sadece log'la
      this.logger.error(
        `AuditLog yazılamadı (${params.entityType}/${params.entityId}): ${(err as Error).message}`,
      );
    }
  }

  /**
   * Yeni versiyon snapshot'u oluştur. version no otomatik (max + 1).
   * Aynı entity için race condition'a karşı: createMany & unique constraint yerine
   * sıralı sorgu (yazım yoğunluğu düşük olduğu için yeterli; admin paneli single-user pattern).
   */
  async snapshot(params: VersionParams): Promise<void> {
    try {
      const last = await this.prisma.contentVersion.findFirst({
        where: { entityType: params.entityType, entityId: params.entityId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const nextVersion = (last?.version ?? 0) + 1;

      await this.prisma.contentVersion.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId,
          version: nextVersion,
          data: params.data as Prisma.InputJsonValue,
          createdBy: params.userId,
        },
      });
    } catch (err) {
      this.logger.error(
        `ContentVersion yazılamadı (${params.entityType}/${params.entityId}): ${(err as Error).message}`,
      );
    }
  }

  /** Bir entity'nin versiyon listesini getir (admin görüntüleme için). */
  async listVersions(
    entityType: string,
    entityId: string,
  ): Promise<Array<{ version: number; createdAt: Date; createdBy: string | null }>> {
    return this.prisma.contentVersion.findMany({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
      select: { version: true, createdAt: true, createdBy: true },
    });
  }
}
