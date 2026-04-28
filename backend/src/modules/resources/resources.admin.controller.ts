import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { AdminResourceQueryDto } from './dto/query-resource.dto';

@ApiTags('admin-resources')
@ApiBearerAuth('JWT-auth')
@Controller('admin/resources')
export class ResourcesAdminController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm resources (admin — paginated, status/type/locale filter).' })
  list(@Query() query: AdminResourceQueryDto) {
    return this.resources.listAdmin(query);
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.resources.findByIdAdmin(id);
  }

  @Post()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni resource oluştur.' })
  create(@Body() dto: CreateResourceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.resources.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Resource güncelle.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.resources.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Resource sil.' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.resources.delete(id, user.id);
  }
}
