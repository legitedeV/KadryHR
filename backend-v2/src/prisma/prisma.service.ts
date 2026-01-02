import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // lepsze niż tajemniczy błąd z Prisma
      throw new Error('DATABASE_URL is missing (required by Prisma v7 adapter).');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter }); // ✅ Prisma v7 wymaga adapter/accelerateUrl :contentReference[oaicite:3]{index=3}
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
