import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api', { exclude: ['health', 'sitemap.xml', 'robots.txt'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Krontech API')
    .setDescription(
      'Krontech.com backend API — içerik yönetimi, formlar, medya, SEO, çok dilli yapı',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'JWT-auth',
    )
    .addTag('auth', 'Kimlik doğrulama ve oturum yönetimi')
    .addTag('products', 'Ürün katalog yönetimi')
    .addTag('blog', 'Blog ve haber içerikleri')
    .addTag('resources', 'Datasheet, case study, whitepaper')
    .addTag('media', 'Medya dosyaları')
    .addTag('forms', 'İletişim ve demo form gönderimleri')
    .addTag('redirects', 'URL yönlendirme yönetimi')
    .addTag('announcement', 'Top banner yönetimi')
    .addTag('offices', 'Ofis bilgileri')
    .addTag('users', 'Kullanıcı yönetimi (admin)')
    .addTag('system', 'Sitemap, revalidation, sistem endpointleri')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Krontech API running [${nodeEnv}] on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Application bootstrap failed:', err);
  process.exit(1);
});
