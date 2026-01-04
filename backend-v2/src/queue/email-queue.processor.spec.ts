import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { configuration } from '../config/configuration';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueProcessor } from './email-queue.processor';

describe('EmailQueueProcessor DI', () => {
  let module: TestingModule;

  beforeEach(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://test:test@localhost:5432/test-database';
    process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
    process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        EmailModule,
      ],
      providers: [
        EmailQueueProcessor,
        {
          provide: PrismaService,
          useValue: {
            notificationDeliveryAttempt: {
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should resolve dependencies from EmailModule', () => {
    const processor = module.get<EmailQueueProcessor>(EmailQueueProcessor);
    expect(processor).toBeDefined();
  });
});
