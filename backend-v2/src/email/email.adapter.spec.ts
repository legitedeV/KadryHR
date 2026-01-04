import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailAdapter } from './email.adapter';
import { AppConfig } from '../config/configuration';

describe('EmailAdapter', () => {
  let adapter: EmailAdapter;
  let configService: ConfigService<AppConfig, true>;

  describe('when email is configured', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          const config: Record<string, any> = {
            'email.host': 'smtp.example.com',
            'email.port': 587,
            'email.secure': false,
            'email.user': 'test@example.com',
            'email.pass': 'password123',
            'email.from': 'noreply@example.com',
            'email.enabled': true,
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      adapter = module.get<EmailAdapter>(EmailAdapter);
      configService = module.get<ConfigService<AppConfig, true>>(ConfigService);
    });

    it('should be defined', () => {
      expect(adapter).toBeDefined();
    });

    it('should send email successfully with configured transporter', async () => {
      // Mock the transporter's sendMail method
      const sendMailMock = jest
        .fn()
        .mockResolvedValue({ messageId: 'test-id' });
      (adapter as any).transporter = { sendMail: sendMailMock };

      const result = await adapter.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
        html: '<p>Test body</p>',
      });

      expect(result).toEqual({ success: true });
      expect(sendMailMock).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
        html: '<p>Test body</p>',
      });
    });

    it('should handle email send errors gracefully', async () => {
      const sendMailMock = jest
        .fn()
        .mockRejectedValue(new Error('SMTP connection failed'));
      (adapter as any).transporter = { sendMail: sendMailMock };

      const result = await adapter.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result).toEqual({
        success: false,
        error: 'SMTP connection failed',
      });
    });
  });

  describe('when email is not configured', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(''),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      adapter = module.get<EmailAdapter>(EmailAdapter);
    });

    it('should skip email sending when not configured', async () => {
      const result = await adapter.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result).toEqual({
        success: false,
        skipped: true,
        error: 'Email adapter not configured',
      });
    });
  });
});
