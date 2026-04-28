import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import type { ProductKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Locale } from './product-translation.dto';

export class PublicProductQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'tr'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'tr'])
  locale?: Locale = 'en';

  @ApiPropertyOptional({ description: 'Kategori slug ile filtrele' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    enum: ['product', 'solution'],
    description: 'Ürün (`product`) veya çözüm (`solution`) listesi; verilmezse tümü.',
  })
  @IsOptional()
  @IsIn(['product', 'solution'])
  kind?: ProductKind;
}

export class AdminProductQueryDto {
  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
