import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesPublicController } from './resources.public.controller';
import { ResourcesAdminController } from './resources.admin.controller';

@Module({
  controllers: [ResourcesPublicController, ResourcesAdminController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
