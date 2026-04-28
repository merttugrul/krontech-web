import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

/**
 * Client direkt S3'e upload ettikten sonra bu endpoint ile metadata commit edilir.
 * Server objesi HEAD etmez (pratikte MinIO'da maliyetli); client'a güvenilir çünkü
 * @Roles admin/editor (form/public kullanımı yok).
 */
export class CommitMediaDto {
  @ApiProperty({ description: "presign endpoint'inin döndürdüğü S3 object key." })
  @IsString()
  @MinLength(3)
  key!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  originalName!: string;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiProperty({ description: 'byte' })
  @IsInt()
  @Min(1)
  size!: number;

  @ApiPropertyOptional({ description: 'Image için genişlik (px).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Image için yükseklik (px).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({ description: 'Erişilebilirlik için alt metin.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}
