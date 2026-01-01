import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from './prisma.service';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:memory:';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

describe('PrismaService shutdown hooks', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let appClosed = false;

  beforeEach(async () => {
    appClosed = false;
    const prisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $on: jest.fn(),
      enableShutdownHooks: PrismaService.prototype.enableShutdownHooks,
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
    await prismaService.enableShutdownHooks(app);
  });

  afterEach(async () => {
    process.removeAllListeners('beforeExit');

    if (!appClosed) {
      await app.close();
      appClosed = true;
    }
  });

  it('disconnects Prisma client on app close', async () => {
    const disconnectSpy = jest
      .spyOn(prismaService, '$disconnect')
      .mockResolvedValue();

    await app.close();
    appClosed = true;

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    disconnectSpy.mockRestore();
  });
});
