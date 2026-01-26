import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  APP_PORT?: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL?: string;

  @IsOptional()
  @IsNumber()
  DATABASE_MAX_RETRIES?: number;

  @IsOptional()
  @IsNumber()
  DATABASE_RETRY_DELAY_MS?: number;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsNumber()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  EMAIL_ENABLED?: string;

  @IsOptional()
  @IsString()
  LEADS_DEFAULT_ORGANISATION_ID?: string;

  @IsOptional()
  @IsString()
  LEADS_NOTIFICATION_EMAIL?: string;

  @IsOptional()
  @IsString()
  LEADS_AUTO_REPLY_ENABLED?: string;

  @IsOptional()
  @IsString()
  LEADS_IP_HASH_SALT?: string;

  @IsOptional()
  @IsString()
  NEWSLETTER_DEFAULT_ORGANISATION_ID?: string;
}

export const validateEnv = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${errors
        .map((error) => JSON.stringify(error.constraints))
        .join(', ')}`,
    );
  }

  return validatedConfig;
};
