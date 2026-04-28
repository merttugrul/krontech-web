import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProductsService } from './products.service';
import { PublicProductQueryDto } from './dto/query-product.dto';
import { Locale } from './dto/product-translation.dto';

@ApiTags('products')
@Public()
@Controller()
export class ProductsPublicController {
  constructor(private readonly products: ProductsService) {}

  @Get('product-categories')
  @ApiOperation({ summary: 'Yayında olan ürün kategorilerini listeler (cache: 10dk).' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'tr'] })
  listCategories(@Query('locale') locale: Locale = 'en') {
    return this.products.listCategoriesPublic(locale);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Yayında olan ürünleri listeler. Locale ve kategori slug ile filtre. (cache: 5dk)',
  })
  list(@Query() query: PublicProductQueryDto) {
    return this.products.listPublic(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Ürün detayını slug ile getirir (cache: 5dk).' })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'tr'] })
  getBySlug(@Param('slug') slug: string, @Query('locale') locale: Locale = 'en') {
    return this.products.findBySlugPublic(slug, locale);
  }
}
