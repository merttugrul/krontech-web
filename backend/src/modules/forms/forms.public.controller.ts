import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { FormsService } from './forms.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { DemoFormDto } from './dto/demo-form.dto';

@ApiTags('forms')
@Public()
@Controller('forms')
export class FormsPublicController {
  constructor(private readonly forms: FormsService) {}

  /**
   * Contact form submit — agresif rate limit: IP başına 5/dakika.
   * Anonymous trafik, spam potansiyeli yüksek.
   */
  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Contact form submission. Rate limit: 5/dk/IP.' })
  submitContact(@Body() dto: ContactFormDto, @Req() req: Request) {
    return this.forms.submitContact(dto, {
      ipAddress: this.getIp(req),
      userAgent: this.getUserAgent(req),
    });
  }

  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Demo request submission. Rate limit: 5/dk/IP.' })
  submitDemo(@Body() dto: DemoFormDto, @Req() req: Request) {
    return this.forms.submitDemo(dto, {
      ipAddress: this.getIp(req),
      userAgent: this.getUserAgent(req),
    });
  }

  private getIp(req: Request): string | undefined {
    // Reverse proxy arkasında X-Forwarded-For header'ı set edilir (trust proxy
    // main.ts'de aktif edilmeli). Fallback: socket.remoteAddress.
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? undefined;
  }

  private getUserAgent(req: Request): string | undefined {
    const ua = req.headers['user-agent'];
    return typeof ua === 'string' ? ua : undefined;
  }
}
