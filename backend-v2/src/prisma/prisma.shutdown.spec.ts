/* eslint-disable @typescript-eslint/unbound-method */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from './prisma.service';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:memory:';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.DATABASE_MAX_RETRIES = '3';
process.env.DATABASE_RETRY_DELAY_MS = '0';

describe('PrismaService lifecycle', () => {
  let app: INestApplication | undefined;

  const createPrismaMock = (connectMock: jest.Mock) => {
    const prisma = {
      $connect: connectMock,
      $disconnect: jest.fn().mockResolvedValue(undefined),
      // @ts-expect-error accessing private helper for test double wiring
      connectWithRetry: (PrismaService.prototype as any).connectWithRetry,
      onModuleDestroy: PrismaService.prototype.onModuleDestroy,
      onModuleInit: PrismaService.prototype.onModuleInit,
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      maxRetries: Number(process.env.DATABASE_MAX_RETRIES ?? 3),
      retryDelayMs: Number(process.env.DATABASE_RETRY_DELAY_MS ?? 0),
    } as unknown as PrismaService;

    return prisma;
  };

  const initAppWithPrisma = async (prismaService: PrismaService) => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  };

  const closeApp = async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  };

  afterEach(async () => {
    await closeApp();
  });

  it('connects on init and disconnects on app close', async () => {
    const prisma = createPrismaMock(jest.fn().mockResolvedValue(undefined));

    await initAppWithPrisma(prisma);

    expect(prisma.$connect).toHaveBeenCalledTimes(1);

    await closeApp();

    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('retries connections before succeeding', async () => {
    const connectMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('DB temporarily unavailable'))
      .mockResolvedValue(undefined);
    const prisma = createPrismaMock(connectMock);

    await initAppWithPrisma(prisma);

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(prisma.logger.warn).toHaveBeenCalled();
  });

  it('throws after exhausting retries', async () => {
    const connectMock = jest.fn().mockRejectedValue(new Error('DB down'));
    const prisma = createPrismaMock(connectMock);

    await expect(initAppWithPrisma(prisma)).rejects.toThrow('DB down');
    expect(prisma.logger.error).toHaveBeenCalled();
  });
});
