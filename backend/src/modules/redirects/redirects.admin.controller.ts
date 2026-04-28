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
import { RedirectsService } from './redirects.service';
import { CreateRedirectDto } from './dto/create-redirect.dto';
import { UpdateRedirectDto } from './dto/update-redirect.dto';
import { AdminRedirectQueryDto } from './dto/query-redirect.dto';

@ApiTags('admin-redirects')
@ApiBearerAuth('JWT-auth')
@Controller('admin/redirects')
export class RedirectsAdminController {
  constructor(private readonly redirects: RedirectsService) {}

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Redirects listesi (paginated, search, isActive filter).' })
  list(@Query() query: AdminRedirectQueryDto) {
    return this.redirects.list(query);
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.redirects.findById(id);
  }

  @Post()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni redirect (fromPath unique).' })
  create(@Body() dto: CreateRedirectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.redirects.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Redirect güncelle.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRedirectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.redirects.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Redirect sil.' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.redirects.delete(id, user.id);
  }
}
