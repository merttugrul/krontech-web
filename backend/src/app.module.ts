import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { configValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from './common/cache/cache.module';
import { AuditModule } from './common/audit/audit.module';
import { S3Module } from './common/s3/s3.module';
import { RecaptchaModule } from './common/recaptcha/recaptcha.module';
import { RevalidationModule } from './common/revalidation/revalidation.module';
import { SchedulerModule } from './common/scheduler/scheduler.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { BlogModule } from './modules/blog/blog.module';
import { MediaModule } from './modules/media/media.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { FormsModule } from './modules/forms/forms.module';
import { RedirectsModule } from './modules/redirects/redirects.module';
import { AnnouncementBarModule } from './modules/announcement-bar/announcement-bar.module';
import { OfficesModule } from './modules/offices/offices.module';
import { SitemapModule } from './modules/sitemap/sitemap.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test'] : ['.env'],
      validate: configValidationSchema,
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 60,
        },
      ],
      // Test ortamında rate limit'i tamamen devre dışı bırak. Aksi halde brute-force
      // koruma e2e testlerde yanlış pozitif 429 üretir. skipIf controller-level
      // @Throttle() override'larını da bypass eder.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),

    PrismaModule,
    RedisModule,
    CacheModule,
    AuditModule,
    S3Module,
    RecaptchaModule,
    RevalidationModule,

    AuthModule,
    UsersModule,
    ProductsModule,
    BlogModule,
    MediaModule,
    ResourcesModule,
    FormsModule,
    RedirectsModule,
    AnnouncementBarModule,
    OfficesModule,
    SitemapModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Sıralama önemli: önce JWT (kimlik), sonra Roles (yetki).
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
