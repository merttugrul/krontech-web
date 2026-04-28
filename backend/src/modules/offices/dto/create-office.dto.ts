import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const OFFICE_LOCALES = ['en', 'tr'] as const;
export type OfficeLocale = (typeof OFFICE_LOCALES)[number];

export const IMAGE_POSITIONS = ['left', 'right'] as const;
export type ImagePosition = (typeof IMAGE_POSITIONS)[number];

export class CreateOfficeDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @ApiProperty({ maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ maxLength: 32 })
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  phone!: string;

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  fax?: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  address!: string;

  @ApiPropertyOptional({ description: 'Kapak görseli URL.' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: IMAGE_POSITIONS, default: 'right' })
  @IsOptional()
  @IsIn(IMAGE_POSITIONS as unknown as string[])
  imagePosition?: ImagePosition;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: OFFICE_LOCALES, default: 'en' })
  @IsOptional()
  @IsIn(OFFICE_LOCALES as unknown as string[])
  locale?: OfficeLocale;
}
