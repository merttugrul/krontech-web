import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('admin-users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
export class UsersAdminController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Tüm admin kullanıcıları (sadece admin).' })
  list() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles(Role.admin)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findById(id);
  }

  @Post()
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur.' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.users.create({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
  }

  @Patch(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Kullanıcı güncelle (şifre opsiyonel).' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminUserDto) {
    return this.users.update(id, {
      email: dto.email,
      password: dto.password,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Kullanıcı sil.' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() current: AuthenticatedUser,
  ) {
    if (current.id === id) {
      throw new ForbiddenException('Kendi hesabınızı silemezsiniz.');
    }
    return this.users.delete(id);
  }
}
