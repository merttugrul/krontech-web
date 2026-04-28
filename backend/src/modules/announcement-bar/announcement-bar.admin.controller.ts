import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementBarService } from './announcement-bar.service';
import { CreateAnnouncementBarDto } from './dto/create-announcement-bar.dto';
import { UpdateAnnouncementBarDto } from './dto/update-announcement-bar.dto';

@ApiTags('admin-announcement-bar')
@ApiBearerAuth('JWT-auth')
@Controller('admin/announcement-bar')
export class AnnouncementBarAdminController {
  constructor(private readonly service: AnnouncementBarService) {}

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm announcement barları listeler (admin).' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni announcement bar.' })
  create(@Body() dto: CreateAnnouncementBarDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Güncelle.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementBarDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Sil.' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.delete(id, user.id);
  }
}
