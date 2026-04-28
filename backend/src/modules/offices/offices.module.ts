import { Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesPublicController } from './offices.public.controller';
import { OfficesAdminController } from './offices.admin.controller';

@Module({
  controllers: [OfficesPublicController, OfficesAdminController],
  providers: [OfficesService],
  exports: [OfficesService],
})
export class OfficesModule {}
