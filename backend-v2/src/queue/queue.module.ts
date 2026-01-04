import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailQueueProcessor } from './email-queue.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const host = configService.get('redis.host', { infer: true });
        const port = configService.get('redis.port', { infer: true });

        return {
          connection: {
            host,
            port,
            // Graceful degradation: if Redis connection fails, the app continues
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
              if (times > 3) {
                return null; // stop retrying
              }
              return Math.min(times * 1000, 3000);
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'email-delivery',
    }),
    EmailModule,
    PrismaModule,
  ],
  providers: [EmailQueueProcessor, QueueService],
  exports: [QueueService],
})
export class QueueModule {}
