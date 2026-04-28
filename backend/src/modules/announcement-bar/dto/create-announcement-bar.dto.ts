import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const ANNOUNCEMENT_LOCALES = ['en', 'tr'] as const;
export type AnnouncementLocale = (typeof ANNOUNCEMENT_LOCALES)[number];

export class CreateAnnouncementBarDto {
  @ApiPropertyOptional({ enum: ANNOUNCEMENT_LOCALES, default: 'en' })
  @IsOptional()
  @IsIn(ANNOUNCEMENT_LOCALES as unknown as string[])
  locale?: AnnouncementLocale;

  @ApiProperty({ minLength: 3, maxLength: 300 })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  text!: string;

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  linkUrl?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  linkLabel?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Yayına başlama zamanı (ISO). Boş → hemen aktif.' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Yayından kalkma zamanı (ISO). Boş → süresiz.' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
