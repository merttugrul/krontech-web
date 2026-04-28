import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, PostType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { BlogTranslationInput, type Locale } from './blog-translation.dto';

export class CreateBlogPostDto {
  @ApiPropertyOptional({
    description:
      "URL slug. Boş bırakılırsa `primaryLocale` (veya yoksa EN) başlığından otomatik üretilir (TR karakterler normalize).",
    example: 'krontech-launches-new-pam-features',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: PostType, default: PostType.blog })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Yazar (User) UUID. Boş ise token sahibine set edilir.' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.draft })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'scheduled status için yayın zamanı (ISO).' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Sidebar "öne çıkan" bloğunda gösterilsin mi.',
  })
  @IsOptional()
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    enum: ['en', 'tr'],
    description:
      "Slug alanı boşken hangi dilin başlığından slug üretileceği. İstemci 'primary' dil ile aynı gönderilmeli (varsayılan: en).",
  })
  @IsOptional()
  @IsIn(['en', 'tr'])
  primaryLocale?: Locale;

  @ApiProperty({
    type: [BlogTranslationInput],
    minItems: 1,
    description: 'En az bir dil (EN veya TR). İkisi birden veya biri gönderilebilir.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BlogTranslationInput)
  translations!: BlogTranslationInput[];
}
