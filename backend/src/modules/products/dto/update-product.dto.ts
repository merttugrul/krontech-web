import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * PATCH için: tüm alanlar opsiyonel.
 * `translations` eğer gönderilirse → upsert (locale bazlı).
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
