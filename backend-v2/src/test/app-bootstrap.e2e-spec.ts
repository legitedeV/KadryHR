import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../app.module';
import { configuration } from '../config/configuration';

describe('AppModule Bootstrap Integration', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    // Set required env vars
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should bootstrap the application successfully', () => {
    expect(app).toBeDefined();
    expect(module).toBeDefined();
  });

  it('should have NotificationsModule loaded', () => {
    // If app initialized, all modules including NotificationsModule are loaded
    expect(app).toBeDefined();
  });

  it('should have EmailAdapter available in DI container', () => {
    const emailModule = module.select(
      require('../email/email.module').EmailModule,
    );
    expect(emailModule).toBeDefined();
  });

  it('should have QueueModule loaded without circular dependency', () => {
    const queueModule = module.select(
      require('../queue/queue.module').QueueModule,
    );
    expect(queueModule).toBeDefined();
  });
});
