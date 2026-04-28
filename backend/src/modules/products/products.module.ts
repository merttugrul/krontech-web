import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsPublicController } from './products.public.controller';
import { ProductsAdminController } from './products.admin.controller';

@Module({
  controllers: [ProductsPublicController, ProductsAdminController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
