import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export type Locale = 'en' | 'tr';

/**
 * FAQ item — BlogPostTranslation.faqItems JSON kolonunda saklanır.
 * Frontend bunu FAQPage JSON-LD'ye dönüştürür (GEO/SEO için kritik).
 */
export class FaqItemInput {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  answer!: string;
}

export class BlogTranslationInput {
  @ApiProperty({ enum: ['en', 'tr'] })
  @IsIn(['en', 'tr'])
  locale!: Locale;

  @ApiProperty({ minLength: 3, maxLength: 250 })
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  title!: string;

  @ApiProperty({ description: 'Kısa özet (liste kartlarında gösterilir).' })
  @IsString()
  @MinLength(10)
  @MaxLength(600)
  excerpt!: string;

  @ApiProperty({ description: 'HTML içerik (TipTap editöründen).' })
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiPropertyOptional({
    description: 'FAQ items — FAQPage structured data için.',
    type: [FaqItemInput],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FaqItemInput)
  faqItems?: FaqItemInput[];

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
}
