import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * S3 / MinIO soyutlaması.
 *
 * Neden presigned URL pattern'i?
 * - Client direkt S3'e yükler → backend bellekten geçmez (büyük dosyalar için kritik).
 * - Backend yalnızca imzalar + sonradan DB'ye metadata kaydeder (commit pattern).
 * - Aksi takdirde multer + stream dev maliyetli ve RAM'i şişirir.
 *
 * `putObject`/`deleteObject` direkt metodlar da sunulur: küçük dosyalar (avatar,
 * otomatik üretilen thumbnails) için bellekte tutup yüklemek daha pratik olabilir.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly publicClient: S3Client;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY', '');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY', '');

    this.bucket = this.config.get<string>('S3_BUCKET', 'krontech-media');
    this.publicEndpoint = this.config.get<string>('S3_PUBLIC_ENDPOINT') ?? endpoint;

    const baseClientConfig = {
      region,
      credentials: { accessKeyId, secretAccessKey },
      // MinIO için path-style zorunlu (virtual-host-style DNS rewrite yapmaz)
      forcePathStyle: true,
    };

    this.client = new S3Client({
      ...baseClientConfig,
      endpoint,
    });
    this.publicClient = new S3Client({
      ...baseClientConfig,
      endpoint: this.publicEndpoint,
    });
  }

  /**
   * Presigned PUT URL üretir. Client bu URL'ye doğrudan PUT atarak dosyayı yükler.
   * `key` opsiyoneldir; verilmezse UUID'li yeni bir key üretilir.
   */
  async presignPut(opts: {
    key?: string;
    contentType: string;
    expiresIn?: number;
    prefix?: string;
  }): Promise<PresignedUploadResult> {
    const key = opts.key ?? this.generateKey(opts.prefix);
    const expiresIn = opts.expiresIn ?? 300; // 5 dk default

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: opts.contentType,
    });

    const uploadUrl = await getSignedUrl(this.publicClient, command, { expiresIn });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
      expiresIn,
    };
  }

  /**
   * Presigned GET URL (private bucket içindeki dosyayı sınırlı süre içinde indirtmek için).
   */
  async presignGet(key: string, expiresIn = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.publicClient, command, { expiresIn });
  }

  /**
   * Küçük dosyaları direkt server'dan yükler (thumbnail, avatar vb.).
   */
  async putObject(opts: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ key: string; publicUrl: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: opts.key,
        Body: opts.body,
        ContentType: opts.contentType,
      }),
    );
    return { key: opts.key, publicUrl: this.getPublicUrl(opts.key) };
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(
        `S3 delete başarısız (${key}): ${(err as Error).message}. ` +
          'DB record yine de silinecek; orphan object cleanup cron ile temizlenmeli.',
      );
    }
  }

  getPublicUrl(key: string): string {
    // MinIO path-style: <endpoint>/<bucket>/<key>
    return `${this.publicEndpoint.replace(/\/$/, '')}/${this.bucket}/${encodeURI(key)}`;
  }

  /**
   * UUID v4 temelli safe key üretir. `prefix` ile klasör yapısı kurulur (ör. `media/`).
   */
  private generateKey(prefix = 'media'): string {
    const safePrefix = prefix.replace(/^\/+|\/+$/g, '');
    return `${safePrefix}/${new Date().getFullYear()}/${randomUUID()}`;
  }
}
