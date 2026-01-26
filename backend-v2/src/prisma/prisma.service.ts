import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppConfig } from '../config/configuration';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(configService: ConfigService<AppConfig, true>) {
    const connectionString = configService.get('database.url', { infer: true });
    if (!connectionString) {
      // lepsze niż tajemniczy błąd z Prisma
      throw new Error(
        'DATABASE_URL is missing (required by Prisma v7 adapter).',
      );
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter }); // ✅ Prisma v7 wymaga adapter/accelerateUrl :contentReference[oaicite:3]{index=3}

    const configuredRetries = Number(
      configService.get('database.maxRetries', { infer: true }),
    );
    const configuredRetryDelay = Number(
      configService.get('database.retryDelayMs', { infer: true }),
    );

    this.maxRetries =
      Number.isFinite(configuredRetries) && configuredRetries > 0
        ? configuredRetries
        : 5;
    this.retryDelayMs =
      Number.isFinite(configuredRetryDelay) && configuredRetryDelay >= 0
        ? configuredRetryDelay
        : 2000;
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry() {
    const maxRetries = Number.isFinite(this.maxRetries) ? this.maxRetries : 5;
    const retryDelayMs = Number.isFinite(this.retryDelayMs)
      ? this.retryDelayMs
      : 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Connected to database after ${attempt} attempts.`);
        }
        return;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        if (isLastAttempt) {
          this.logger.error(
            'Database connection failed after all retries.',
            error as Error,
          );
          throw error;
        }

        this.logger.warn(
          `Database connection attempt ${attempt} failed. Retrying in ${retryDelayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
}
