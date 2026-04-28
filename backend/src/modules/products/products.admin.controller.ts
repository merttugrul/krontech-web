import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto } from './dto/query-product.dto';
import { ScheduleProductDto } from './dto/schedule-product.dto';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/product-category.dto';

@ApiTags('admin-products')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class ProductsAdminController {
  constructor(private readonly products: ProductsService) {}

  // ───── Categories ─────

  @Get('product-categories')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm kategoriler (admin — translations dahil).' })
  listCategories() {
    return this.products.listCategoriesAdmin();
  }

  @Post('product-categories')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni kategori oluştur.' })
  createCategory(@Body() dto: CreateProductCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.products.createCategory(dto, user.id);
  }

  @Patch('product-categories/:id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Kategori güncelle (translations upsert).' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.products.updateCategory(id, dto, user.id);
  }

  @Delete('product-categories/:id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Kategori sil (içinde ürün varsa 409 döner).' })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.products.deleteCategory(id, user.id);
  }

  // ───── Products ─────

  @Get('products')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm ürünler (admin — paginated, status filter).' })
  list(@Query() query: AdminProductQueryDto) {
    return this.products.listAdmin(query);
  }

  @Get('products/:id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürün detayı (admin — tüm dillerdeki translations).' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.findByIdAdmin(id);
  }

  @Post('products')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni ürün oluştur (translations dahil).' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.products.create(dto, user.id);
  }

  @Patch('products/:id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürün güncelle (translations upsert).' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.products.update(id, dto, user.id);
  }

  @Delete('products/:id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Ürün sil (cascade: translations, testimonials).' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.products.delete(id, user.id);
  }

  @Post('products/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürünü yayına al.' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.products.publish(id, user.id);
  }

  @Post('products/:id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürünü taslağa çek.' })
  unpublish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.products.unpublish(id, user.id);
  }

  @Post('products/:id/schedule')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürünü ileri tarihli yayın için planla.' })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.products.schedule(id, dto.scheduledAt, user.id);
  }

  @Get('products/:id/versions')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Ürünün versiyon geçmişi (snapshot listesi).' })
  versions(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.listVersions(id);
  }
}
