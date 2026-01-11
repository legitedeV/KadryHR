import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

export type SmsSendResult = {
  success: boolean;
  skipped?: boolean;
  error?: string | null;
  messageId?: string | null;
};

export interface SmsProviderAdapter {
  sendSms(to: string, message: string): Promise<SmsSendResult>;
  isConfigured(): boolean;
}

/**
 * SMS Adapter with pluggable provider support.
 *
 * Currently supports:
 * - Twilio (set SMS_PROVIDER=twilio)
 * - Console logging for development (default when not configured)
 *
 * Environment variables:
 * - SMS_ENABLED: Enable/disable SMS sending (default: false)
 * - SMS_PROVIDER: Provider name (twilio, console)
 * - SMS_ACCOUNT_SID: Twilio Account SID
 * - SMS_AUTH_TOKEN: Twilio Auth Token
 * - SMS_FROM_NUMBER: Sender phone number (E.164 format)
 */
@Injectable()
export class SmsAdapter {
  private readonly logger = new Logger(SmsAdapter.name);
  private readonly enabled: boolean;
  private readonly provider: string;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.enabled = this.configService.get('sms.enabled', { infer: true }) ?? false;
    this.provider = this.configService.get('sms.provider', { infer: true }) ?? 'console';
    this.accountSid = this.configService.get('sms.accountSid', { infer: true }) ?? '';
    this.authToken = this.configService.get('sms.authToken', { infer: true }) ?? '';
    this.fromNumber = this.configService.get('sms.fromNumber', { infer: true }) ?? '';

    if (!this.enabled) {
      this.logger.warn('[SmsAdapter] SMS disabled: SMS_ENABLED=false or not set');
      return;
    }

    if (this.provider === 'twilio' && (!this.accountSid || !this.authToken || !this.fromNumber)) {
      this.logger.warn(
        '[SmsAdapter] Twilio provider selected but missing configuration (SMS_ACCOUNT_SID/SMS_AUTH_TOKEN/SMS_FROM_NUMBER). SMS will be logged only.',
      );
    } else if (this.provider === 'twilio') {
      this.logger.log('[SmsAdapter] Twilio SMS provider configured');
    } else {
      this.logger.log(`[SmsAdapter] Using ${this.provider} provider (messages will be logged)`);
    }
  }

  /**
   * Check if SMS sending is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if the provider is fully configured for actual delivery
   */
  isConfigured(): boolean {
    if (!this.enabled) return false;
    if (this.provider === 'twilio') {
      return !!(this.accountSid && this.authToken && this.fromNumber);
    }
    return false; // Console provider doesn't actually send
  }

  /**
   * Send an SMS message
   * @param to Phone number in E.164 format (e.g., +48123456789)
   * @param message The message text (max 1600 characters for Twilio)
   */
  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    if (!this.enabled) {
      return {
        success: false,
        skipped: true,
        error: 'SMS adapter not enabled',
      };
    }

    // Normalize phone number
    const normalizedTo = this.normalizePhoneNumber(to);
    if (!normalizedTo) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    // Route to appropriate provider
    if (this.provider === 'twilio' && this.isConfigured()) {
      return this.sendViaTwilio(normalizedTo, message);
    }

    // Console/development mode - just log
    return this.sendViaConsole(normalizedTo, message);
  }

  /**
   * Send via Twilio API
   */
  private async sendViaTwilio(to: string, message: string): Promise<SmsSendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message.substring(0, 1600), // Twilio limit
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Twilio API error: ${response.status} - ${errorData}`);
        return {
          success: false,
          error: `Twilio API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as { sid?: string };
      this.logger.log(`SMS sent via Twilio to ${to}, SID: ${data.sid}`);

      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMS send error';
      this.logger.error(`Failed to send SMS via Twilio: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Console provider - logs the message (for development/testing)
   */
  private async sendViaConsole(to: string, message: string): Promise<SmsSendResult> {
    this.logger.log(`[SMS Console] To: ${to}`);
    this.logger.log(`[SMS Console] Message: ${message}`);

    return {
      success: true,
      skipped: true,
      messageId: `console-${Date.now()}`,
      error: 'Console provider - message logged only',
    };
  }

  /**
   * Normalize phone number to E.164 format
   * Assumes Polish numbers if no country code provided
   */
  private normalizePhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If starts with 00, replace with +
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    }

    // If no + prefix and 9 digits (Polish mobile), add +48
    if (!normalized.startsWith('+')) {
      if (normalized.length === 9) {
        normalized = '+48' + normalized;
      } else if (normalized.length === 11 && normalized.startsWith('48')) {
        normalized = '+' + normalized;
      }
    }

    // Validate E.164 format (+ followed by 10-15 digits)
    if (!/^\+\d{10,15}$/.test(normalized)) {
      this.logger.warn(`Invalid phone number format: ${phone} -> ${normalized}`);
      return null;
    }

    return normalized;
  }

  /**
   * Send test SMS
   */
  async sendTestSms(to: string): Promise<SmsSendResult> {
    return this.sendSms(to, 'To jest testowa wiadomość SMS z systemu KadryHR. Test notification!');
  }
}
