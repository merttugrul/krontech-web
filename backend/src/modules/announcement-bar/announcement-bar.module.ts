import { Module } from '@nestjs/common';
import { AnnouncementBarService } from './announcement-bar.service';
import { AnnouncementBarPublicController } from './announcement-bar.public.controller';
import { AnnouncementBarAdminController } from './announcement-bar.admin.controller';

@Module({
  controllers: [AnnouncementBarPublicController, AnnouncementBarAdminController],
  providers: [AnnouncementBarService],
  exports: [AnnouncementBarService],
})
export class AnnouncementBarModule {}
