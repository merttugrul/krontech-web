import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

/**
 * Desteklenen MIME tipleri. Güvenlik için whitelist — ARBITRARY file upload
 * tehlikelidir (HTML/JS yüklenip XSS tetiklenebilir).
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export class PresignMediaDto {
  @ApiProperty({ enum: ALLOWED_MIME_TYPES })
  @IsIn(ALLOWED_MIME_TYPES as unknown as string[])
  mimeType!: AllowedMimeType;

  @ApiProperty({ description: 'Orijinal dosya adı (kullanıcıya gösterilecek).' })
  @IsString()
  @MinLength(1)
  originalName!: string;

  @ApiProperty({ description: 'Dosya boyutu (byte). Max 50MB.' })
  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  size!: number;

  @ApiPropertyOptional({ description: 'Klasör prefix. Default "media".' })
  @IsOptional()
  @IsString()
  prefix?: string;
}
