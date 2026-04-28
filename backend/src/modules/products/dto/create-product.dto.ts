import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, ProductKind } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductTranslationInput } from './product-translation.dto';

export class CreateProductDto {
  @ApiProperty({
    description:
      "URL slug. Boş bırakılırsa EN translation title'ından otomatik üretilir (normalize edilir).",
    example: 'kron-pam',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.draft })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'scheduled status için yayın zamanı (ISO)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: ['product', 'solution'], default: 'product' })
  @IsOptional()
  @IsIn(['product', 'solution'])
  kind?: ProductKind;

  @ApiProperty({ type: [ProductTranslationInput], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationInput)
  translations!: ProductTranslationInput[];
}
