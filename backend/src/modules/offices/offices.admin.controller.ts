import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';

@ApiTags('admin-offices')
@ApiBearerAuth('JWT-auth')
@Controller('admin/offices')
export class OfficesAdminController {
  constructor(private readonly offices: OfficesService) {}

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm ofisler (admin, locale+order sıralı).' })
  list() {
    return this.offices.listAdmin();
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.offices.findById(id);
  }

  @Post()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni ofis.' })
  create(@Body() dto: CreateOfficeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.offices.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Güncelle.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfficeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.offices.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Sil.' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.offices.delete(id, user.id);
  }
}
