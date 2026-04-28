import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Contact form submission payload.
 *
 * NOT: Email/firma/mesaj validasyonu müşteri beklentisi (honeypot + reCAPTCHA
 * + rate limit combo'su ile spam koruması controller seviyesinde uygulanır).
 */
export class ContactFormDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Hangi sayfadan geldi.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @ApiPropertyOptional({ description: 'en|tr — kullanıcı arayüzü dili.' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @ApiPropertyOptional({ description: 'Google reCAPTCHA token.' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;

  @ApiPropertyOptional({
    description:
      'Honeypot alanı — bot doldurursa submission reddedilir. Gerçek UI alanı boş bırakılmalı.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
