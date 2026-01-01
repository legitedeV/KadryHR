<<<<<<< HEAD
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
=======
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
>>>>>>> 30bbeef751f1e7ff4deb2abb586dd55f841071c0

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // przekazujemy adapter; opcjonalnie logi dla wygody
    super({
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await pool.end();
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
