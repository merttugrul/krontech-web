import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RedirectsService } from './redirects.service';

@ApiTags('redirects')
@Public()
@Controller('redirects')
export class RedirectsPublicController {
  constructor(private readonly redirects: RedirectsService) {}

  /**
   * Next.js middleware bu endpoint'i her HTTP request'te çağırabilir.
   * Sonuç agresif cache'lenir (pozitif: 5dk, negatif: 5dk) → DB'ye nadir gider.
   */
  @Get('lookup')
  @ApiOperation({
    summary: 'Verilen path için aktif redirect varsa {toPath, statusCode} döner; yoksa 200 + null.',
  })
  @ApiQuery({ name: 'from', required: true, description: '"/" ile başlamalı.' })
  async lookup(@Query('from') from: string) {
    const result = await this.redirects.lookup(from);
    return { redirect: result };
  }
}
