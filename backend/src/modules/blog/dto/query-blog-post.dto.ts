import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, PostType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Locale } from './blog-translation.dto';

export class PublicBlogQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'tr'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'tr'])
  locale?: Locale = 'en';

  @ApiPropertyOptional({
    enum: PostType,
    description: 'blog (default) veya news. Frontend /blog ve /news ayrı listeler.',
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Sadece öne çıkanları getir.' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 12;
}

export class AdminBlogQueryDto {
  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

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
