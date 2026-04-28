import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
  IsEmail,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  CORS_ORIGIN!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  S3_ENDPOINT!: string;

  @IsString()
  @IsOptional()
  S3_PUBLIC_ENDPOINT?: string;

  @IsString()
  S3_BUCKET!: string;

  @IsString()
  S3_ACCESS_KEY!: string;

  @IsString()
  S3_SECRET_KEY!: string;

  @IsString()
  @IsOptional()
  S3_REGION: string = 'us-east-1';

  @IsString()
  @IsOptional()
  RECAPTCHA_SECRET?: string;

  @IsString()
  REVALIDATION_SECRET!: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  NEXT_PUBLIC_API_URL?: string;

  /**
   * Sitemap base URL + revalidation hedef URL. Üretim: https://krontech.com.
   * Development: http://localhost:3000. Trailing slash olmasın.
   */
  @IsUrl({ require_tld: false })
  @IsOptional()
  NEXT_PUBLIC_SITE_URL?: string;

  @IsEmail()
  ADMIN_EMAIL!: string;

  @IsString()
  ADMIN_PASSWORD!: string;
}

export function configValidationSchema(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => `  - ${err.property}: ${Object.values(err.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validated;
}
