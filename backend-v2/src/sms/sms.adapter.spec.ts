import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsAdapter } from './sms.adapter';

describe('SmsAdapter', () => {
  let adapter: SmsAdapter;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default: SMS disabled
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, unknown> = {
        'sms.enabled': false,
        'sms.provider': 'console',
        'sms.accountSid': '',
        'sms.authToken': '',
        'sms.fromNumber': '',
      };
      return config[key] ?? undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsAdapter,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    adapter = module.get<SmsAdapter>(SmsAdapter);
  });

  describe('isEnabled', () => {
    it('should return false when SMS_ENABLED is false', () => {
      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('should return false when SMS is disabled', () => {
      expect(adapter.isConfigured()).toBe(false);
    });
  });

  describe('sendSms', () => {
    it('should return skipped when SMS is disabled', async () => {
      const result = await adapter.sendSms('+48123456789', 'Test message');

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.error).toBe('SMS adapter not enabled');
    });

    it('should return error for invalid phone number format', async () => {
      // Enable SMS for this test
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'sms.enabled': true,
          'sms.provider': 'console',
          'sms.accountSid': '',
          'sms.authToken': '',
          'sms.fromNumber': '',
        };
        return config[key] ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          SmsAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const enabledAdapter = module.get<SmsAdapter>(SmsAdapter);

      const result = await enabledAdapter.sendSms('invalid', 'Test message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number format');
    });

    it('should log message when using console provider', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'sms.enabled': true,
          'sms.provider': 'console',
          'sms.accountSid': '',
          'sms.authToken': '',
          'sms.fromNumber': '',
        };
        return config[key] ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          SmsAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const consoleAdapter = module.get<SmsAdapter>(SmsAdapter);

      const result = await consoleAdapter.sendSms('+48123456789', 'Test message');

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true); // Console provider marks as skipped
      expect(result.messageId).toContain('console-');
    });

    it('should normalize Polish phone numbers correctly', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'sms.enabled': true,
          'sms.provider': 'console',
          'sms.accountSid': '',
          'sms.authToken': '',
          'sms.fromNumber': '',
        };
        return config[key] ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          SmsAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const consoleAdapter = module.get<SmsAdapter>(SmsAdapter);

      // Test with 9-digit Polish number (should add +48)
      const result1 = await consoleAdapter.sendSms('123456789', 'Test');
      expect(result1.success).toBe(true);

      // Test with +48 prefix
      const result2 = await consoleAdapter.sendSms('+48123456789', 'Test');
      expect(result2.success).toBe(true);

      // Test with 00 prefix
      const result3 = await consoleAdapter.sendSms('0048123456789', 'Test');
      expect(result3.success).toBe(true);
    });
  });

  describe('sendTestSms', () => {
    it('should send a test SMS with predefined message', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, unknown> = {
          'sms.enabled': true,
          'sms.provider': 'console',
          'sms.accountSid': '',
          'sms.authToken': '',
          'sms.fromNumber': '',
        };
        return config[key] ?? undefined;
      });

      const module = await Test.createTestingModule({
        providers: [
          SmsAdapter,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const consoleAdapter = module.get<SmsAdapter>(SmsAdapter);

      const result = await consoleAdapter.sendTestSms('+48123456789');

      expect(result.success).toBe(true);
    });
  });
});
