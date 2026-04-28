import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateResourceDto } from './create-resource.dto';

/**
 * `productId: null` — ürün ilişkisini kaldırır. PartialType ile gelen
 * `@IsUUID()` null'da hata verirdi; bu alan ayrı tanımlanır.
 */
export class UpdateResourceDto extends PartialType(
  OmitType(CreateResourceDto, ['productId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Bağlı ürün UUID; null gönderilirse ilişki silinir.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsUUID()
  productId?: string | null;
}
