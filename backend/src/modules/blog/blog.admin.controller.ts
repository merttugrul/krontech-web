import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { BlogService } from './blog.service';
import { BlogTranslationInput } from './dto/blog-translation.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { AdminBlogQueryDto } from './dto/query-blog-post.dto';
import { ScheduleBlogPostDto } from './dto/schedule-blog-post.dto';

@ApiTags('admin-blog')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
export class BlogAdminController {
  constructor(private readonly blog: BlogService) {}

  @Get('blog')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tüm blog/news postları (admin — paginated, status+type filter).' })
  list(@Query() query: AdminBlogQueryDto) {
    return this.blog.listAdmin(query);
  }

  @Get('blog/:id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Post detayı (admin — tüm dillerdeki translations).' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.findByIdAdmin(id);
  }

  @Post('blog')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Yeni post (authorId verilmezse isteği yapan user atanır).' })
  create(@Body() dto: CreateBlogPostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blog.create(dto, user.id);
  }

  @Patch('blog/:id')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Post güncelle (translations upsert).' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blog.update(id, dto, user.id);
  }

  @Post('blog/:id/translations')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Tek dil çevirisi ekle veya güncelle (upsert).' })
  upsertTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BlogTranslationInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blog.update(id, { translations: [body] }, user.id);
  }

  @Delete('blog/:id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Post sil (cascade: translations, versions).' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blog.delete(id, user.id);
  }

  @Post('blog/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Postu yayına al.' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blog.publish(id, user.id);
  }

  @Post('blog/:id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Postu taslağa çek.' })
  unpublish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blog.unpublish(id, user.id);
  }

  @Post('blog/:id/schedule')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Postu ileri tarihli yayın için planla.' })
  schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleBlogPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blog.schedule(id, dto.scheduledAt, user.id);
  }

  @Get('blog/:id/versions')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Postun versiyon geçmişi (snapshot listesi).' })
  versions(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.listVersions(id);
  }
}
