import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export type Locale = 'en' | 'tr';

export class ProductTranslationInput {
  @ApiProperty({ enum: ['en', 'tr'] })
  @IsIn(['en', 'tr'])
  locale!: Locale;

  @ApiProperty({ minLength: 2, maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  shortDescription!: string;

  @ApiPropertyOptional({ description: 'Solution tab içeriği (JSON blok)' })
  @IsOptional()
  @IsObject()
  solution?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: 'How it works tab içeriği' })
  @IsOptional()
  @IsObject()
  howItWorks?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: 'Key benefits — [{title, description, icon}]' })
  @IsOptional()
  @IsObject()
  keyBenefits?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: 'Product family — ilişkili ürünlerin slug listesi' })
  @IsOptional()
  @IsObject()
  productFamily?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: 'Videos — [{title, youtubeUrl}]' })
  @IsOptional()
  @IsObject()
  videos?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ogImage?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown>;
}

export class ProductTranslationsWrapper {
  @ApiProperty({ type: [ProductTranslationInput], minItems: 1 })
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationInput)
  translations!: ProductTranslationInput[];
}
