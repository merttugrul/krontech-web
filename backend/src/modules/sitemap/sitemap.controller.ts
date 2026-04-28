import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SitemapService } from './sitemap.service';

/**
 * Sitemap, Google Search Console / Bing Webmaster araçlarının okuyabilmesi için
 * application/xml content-type ile sunulur. Global prefix "api" devre dışı
 * bırakılmış (AppModule'da `exclude: ['sitemap.xml']`) — böylece URL
 * `/sitemap.xml` olur, `/api/sitemap.xml` değil (arama motorları kök path bekler).
 */
@ApiTags('sitemap')
@Public()
@Controller()
export class SitemapController {
  constructor(private readonly sitemap: SitemapService) {}

  @Get('sitemap.xml')
  @ApiOperation({
    summary:
      'Tüm yayınlanmış içerikleri listeleyen XML sitemap. Cache 1 saat. Content-Type: application/xml.',
  })
  @ApiProduces('application/xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  async xml(@Res() res: Response): Promise<void> {
    const body = await this.sitemap.buildXml();
    res.send(body);
  }
}
