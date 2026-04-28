import { Module } from '@nestjs/common';
import { RedirectsService } from './redirects.service';
import { RedirectsPublicController } from './redirects.public.controller';
import { RedirectsAdminController } from './redirects.admin.controller';

@Module({
  controllers: [RedirectsPublicController, RedirectsAdminController],
  providers: [RedirectsService],
  exports: [RedirectsService],
})
export class RedirectsModule {}
