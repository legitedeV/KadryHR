import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from './prisma.service';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:memory:';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

describe('PrismaService lifecycle', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let appClosed = false;

  beforeEach(async () => {
    appClosed = false;
    const prisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: PrismaService.prototype.onModuleDestroy,
      onModuleInit: PrismaService.prototype.onModuleInit,
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    prismaService = app.get(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    if (!appClosed) {
      await app.close();
      appClosed = true;
    }
  });

  it('connects on init and disconnects on app close', async () => {
    expect(prismaService.$connect).toHaveBeenCalledTimes(1);

    await app.close();
    appClosed = true;

    expect(prismaService.$disconnect).toHaveBeenCalledTimes(1);
  });
});
