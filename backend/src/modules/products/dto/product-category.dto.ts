import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Locale } from './product-translation.dto';

export class ProductCategoryTranslationInput {
  @ApiProperty({ enum: ['en', 'tr'] })
  @IsIn(['en', 'tr'])
  locale!: Locale;

  @ApiProperty()
  @IsString()
  name!: string;
}

export class CreateProductCategoryDto {
  @ApiPropertyOptional({ description: "Boş bırakılırsa EN translation name'inden üretilir" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [ProductCategoryTranslationInput], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductCategoryTranslationInput)
  translations!: ProductCategoryTranslationInput[];
}

export class UpdateProductCategoryDto extends PartialType(CreateProductCategoryDto) {}
