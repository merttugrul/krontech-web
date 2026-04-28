import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { OfficesService } from './offices.service';
import { OFFICE_LOCALES, OfficeLocale } from './dto/create-office.dto';

@ApiTags('offices')
@Public()
@Controller('offices')
export class OfficesPublicController {
  constructor(private readonly offices: OfficesService) {}

  @Get()
  @ApiOperation({
    summary: 'Verilen locale için tüm ofisler (order asc). Cache 10dk.',
  })
  @ApiQuery({ name: 'locale', required: false, enum: OFFICE_LOCALES })
  list(@Query('locale') locale: OfficeLocale = 'en') {
    return this.offices.listPublic(locale);
  }
}
