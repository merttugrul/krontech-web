import { INestApplication, Type, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

/**
 * Test-specific provider override. `provider` gerçek constructor (class),
 * `useValue` test double (ör. S3Service mock).
 */
export interface ProviderOverride<T = unknown> {
  provider: Type<T> | string | symbol;
  useValue: unknown;
}

export interface CreateTestAppOptions {
  overrides?: ProviderOverride[];
}

/**
 * E2E testler için NestJS app instance oluşturur.
 * main.ts'deki tüm middleware/pipes'ı aynen uygular → production'la aynı davranış.
 *
 * `options.overrides` — DI container'da provider'ı test double ile değiştirir.
 * Genelde dış servis bağlayıcıları (S3Service vb.) için kullanılır.
 */
export async function createTestApp(options: CreateTestAppOptions = {}): Promise<{
  app: INestApplication;
  module: TestingModule;
}> {
  process.env.NODE_ENV = 'test';

  let builder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  for (const ov of options.overrides ?? []) {
    builder = builder.overrideProvider(ov.provider).useValue(ov.useValue);
  }

  const module = await builder.compile();

  const app = module.createNestApplication({ logger: false });

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

  await app.init();
  return { app, module };
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
