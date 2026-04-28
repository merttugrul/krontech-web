import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { BlogService } from './blog.service';
import { PublicBlogQueryDto } from './dto/query-blog-post.dto';
import { Locale } from './dto/blog-translation.dto';

@ApiTags('blog')
@Public()
@Controller()
export class BlogPublicController {
  constructor(private readonly blog: BlogService) {}

  @Get('blog')
  @ApiOperation({
    summary:
      'Yayında olan blog/news postlarını listeler. Locale, type (blog|news), isHighlight ile filtre. (cache: 5dk)',
  })
  list(@Query() query: PublicBlogQueryDto) {
    return this.blog.listPublic(query);
  }

  @Get('blog/:slug')
  @ApiOperation({
    summary:
      'Blog post detayı (slug ile). Her çağrıda viewCount artar (fire-and-forget). (cache: 5dk)',
  })
  @ApiQuery({ name: 'locale', required: false, enum: ['en', 'tr'] })
  getBySlug(@Param('slug') slug: string, @Query('locale') locale: Locale = 'en') {
    return this.blog.findBySlugPublic(slug, locale);
  }
}
