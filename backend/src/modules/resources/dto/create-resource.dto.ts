import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, ResourceType } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const RESOURCE_LOCALES = ['en', 'tr'] as const;
export type ResourceLocale = (typeof RESOURCE_LOCALES)[number];

export class CreateResourceDto {
  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiPropertyOptional({ description: 'Bağlı ürün UUID.' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Kapak görseli URL.' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: 'İndirilebilir dosya URL (genelde S3).' })
  @IsString()
  @IsUrl({ require_tld: false })
  fileUrl!: string;

  @ApiPropertyOptional({ enum: RESOURCE_LOCALES, default: 'en' })
  @IsOptional()
  @IsIn(RESOURCE_LOCALES as unknown as string[])
  locale?: ResourceLocale;

  @ApiProperty({ minLength: 3, maxLength: 250 })
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: ContentStatus,
    default: ContentStatus.published,
    description:
      "Resources tablosunda publishedAt kolonu yok — `published` olanlar public API'de görünür, `draft` görünmez. `scheduled` desteklenmez (basit lifecycle).",
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
