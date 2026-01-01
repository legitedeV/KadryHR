import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Please configure the database connection.');
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma 7 keeps the beforeExit event but removes it from the public
    // typings, so we cast the listener to maintain graceful shutdown
    // behavior without losing type safety elsewhere.
    (this.$on as unknown as (event: 'beforeExit', cb: () => Promise<void>) => void)(
      'beforeExit',
      async () => {
      await app.close();
      },
    );

    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}
