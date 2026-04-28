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
import { IsString, MaxLength } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';
import { PresignMediaDto } from './dto/presign-media.dto';
import { CommitMediaDto } from './dto/commit-media.dto';
import { MediaQueryDto } from './dto/query-media.dto';

export class UpdateAltTextDto {
  @IsString()
  @MaxLength(500)
  altText!: string;
}

@ApiTags('admin-media')
@ApiBearerAuth('JWT-auth')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin, Role.editor)
  @ApiOperation({
    summary:
      "S3 presigned PUT URL üretir. Client bu URL'ye doğrudan PUT atar, sonra /commit çağırır.",
  })
  presign(@Body() dto: PresignMediaDto) {
    return this.media.presign(dto);
  }

  @Post('commit')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: "Upload tamamlandıktan sonra metadata'yı DB'ye kaydeder." })
  commit(@Body() dto: CommitMediaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.media.commit(dto, user.id);
  }

  @Get()
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Media library (paginated + search).' })
  list(@Query() query: MediaQueryDto) {
    return this.media.list(query);
  }

  @Get(':id')
  @Roles(Role.admin, Role.editor)
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.findById(id);
  }

  @Patch(':id/alt-text')
  @Roles(Role.admin, Role.editor)
  @ApiOperation({ summary: 'Sadece altText güncelle (accessibility).' })
  updateAltText(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAltTextDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.media.updateAltText(id, dto.altText, user.id);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Media sil (DB + S3 object).' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.media.delete(id, user.id);
  }
}
