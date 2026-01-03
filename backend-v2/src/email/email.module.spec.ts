import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email.module';
import { EmailAdapter } from './email.adapter';
import { configuration } from '../config/configuration';

describe('EmailModule Integration', () => {
  let module: TestingModule;
  let emailAdapter: EmailAdapter;

  beforeEach(async () => {
    // Set minimal env vars for testing
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        EmailModule,
      ],
    }).compile();

    emailAdapter = module.get<EmailAdapter>(EmailAdapter);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should bootstrap EmailModule successfully', () => {
    expect(module).toBeDefined();
    expect(emailAdapter).toBeDefined();
  });

  it('should provide EmailAdapter via dependency injection', () => {
    const adapter = module.get<EmailAdapter>(EmailAdapter);
    expect(adapter).toBeInstanceOf(EmailAdapter);
  });

  it('should handle missing email configuration gracefully', async () => {
    const result = await emailAdapter.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test message',
    });

    // Should skip email when not configured
    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
  });
});
