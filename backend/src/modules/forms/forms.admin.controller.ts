import { Controller, Delete, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { FormsService } from './forms.service';
import { AdminFormQueryDto } from './dto/query-form.dto';

@ApiTags('admin-forms')
@ApiBearerAuth('JWT-auth')
@Controller('admin/forms')
export class FormsAdminController {
  constructor(private readonly forms: FormsService) {}

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Form submission listesi (paginated, formType + tarih filtre).' })
  list(@Query() query: AdminFormQueryDto) {
    return this.forms.list(query);
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.forms.findById(id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Submission sil (GDPR talepleri için).' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.forms.delete(id);
  }
}
