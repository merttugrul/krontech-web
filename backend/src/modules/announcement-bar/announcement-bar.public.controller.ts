import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AnnouncementBarService } from './announcement-bar.service';
import { ANNOUNCEMENT_LOCALES, AnnouncementLocale } from './dto/create-announcement-bar.dto';

@ApiTags('announcement-bar')
@Public()
@Controller('announcement-bar')
export class AnnouncementBarPublicController {
  constructor(private readonly service: AnnouncementBarService) {}

  @Get()
  @ApiOperation({
    summary:
      'Verilen locale için şu anda aktif (tarih aralığında) duyuru bandını döner. Yoksa null.',
  })
  @ApiQuery({ name: 'locale', required: false, enum: ANNOUNCEMENT_LOCALES })
  async active(@Query('locale') locale: AnnouncementLocale = 'en') {
    const bar = await this.service.findActive(locale);
    return { announcement: bar };
  }
}
