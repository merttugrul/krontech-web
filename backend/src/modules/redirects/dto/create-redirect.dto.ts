import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Redirect path'leri "/" ile başlamalı ve absolute URL olmamalı.
 * Cross-domain redirect kapsamı dışı — tehlikeli (open-redirect attack).
 */
const PATH_REGEX = /^\/[^\s?#]*$/;

export class CreateRedirectDto {
  @ApiProperty({
    description: 'Kaynak path (unique). "/" ile başlamalı.',
    example: '/eski-urun-sayfasi',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  @Matches(PATH_REGEX, {
    message: 'fromPath "/" ile başlamalı ve boşluk/?/# içermemeli',
  })
  fromPath!: string;

  @ApiProperty({
    description: 'Hedef path. Cross-domain için absolute URL de kabul edilir.',
    example: '/urunler/yeni-urun',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  toPath!: string;

  @ApiPropertyOptional({
    description: '301 (Moved Permanently) veya 302 (Found). Default 301.',
    enum: [301, 302],
    default: 301,
  })
  @IsOptional()
  @IsIn([301, 302])
  statusCode?: 301 | 302;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
