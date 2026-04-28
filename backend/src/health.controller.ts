import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { Public } from './common/decorators/public.decorator';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  uptime: number;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@ApiTags('system')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Servis sağlık kontrolü (DB + Redis)' })
  @ApiResponse({ status: 200, description: 'Sistem sağlık raporu' })
  async check(): Promise<HealthStatus> {
    const [dbUp, redisUp] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    const allUp = dbUp && redisUp;
    return {
      status: allUp ? 'ok' : dbUp || redisUp ? 'degraded' : 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}
