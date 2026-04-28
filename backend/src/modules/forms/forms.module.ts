import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsPublicController } from './forms.public.controller';
import { FormsAdminController } from './forms.admin.controller';

@Module({
  controllers: [FormsPublicController, FormsAdminController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
