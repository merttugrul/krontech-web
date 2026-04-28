import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ResourcesService } from './resources.service';
import { PublicResourceQueryDto } from './dto/query-resource.dto';
import { ResourceLocale } from './dto/create-resource.dto';

@ApiTags('resources')
@Public()
@Controller('resources')
export class ResourcesPublicController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Published resources (datasheet / case study / whitepaper). Locale + type + product filter. (cache 5dk)',
  })
  list(@Query() query: PublicResourceQueryDto) {
    return this.resources.listPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Resource detay (locale match zorunlu).' })
  @ApiQuery({ name: 'locale', required: false })
  getById(@Param('id', ParseUUIDPipe) id: string, @Query('locale') locale: ResourceLocale = 'en') {
    return this.resources.findByIdPublic(id, locale);
  }
}
