import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { AppConfig } from '../config/configuration';

export type EmailSendResult = {
  success: boolean;
  skipped?: boolean;
  error?: string | null;
};

@Injectable()
export class EmailAdapter {
  private readonly logger = new Logger(EmailAdapter.name);
  // TypeScript strict mode issue with nodemailer.Transporter type definition
  // This is a known limitation - the type acts as 'any' in union types
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string | null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    this.enabled = this.configService.get('email.enabled', { infer: true });

    const host = this.configService.get('email.host', { infer: true });
    const port = this.configService.get('email.port', { infer: true });
    const user = this.configService.get('email.user', { infer: true });
    const pass = this.configService.get('email.pass', { infer: true });
    const from = this.configService.get('email.from', { infer: true });
    const secure = this.configService.get('email.secure', { infer: true });

    const missingConfig = [host, port, user, pass, from].some((val) => !val);

    if (!this.enabled) {
      this.transporter = null;
      this.fromAddress = null;
      this.logger.warn('[EmailAdapter] Email disabled: EMAIL_ENABLED=false');
      return;
    }

    if (missingConfig) {
      this.transporter = null;
      this.fromAddress = null;
      this.logger.warn(
        '[EmailAdapter] Email disabled: missing SMTP configuration (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM)',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    this.fromAddress = from;
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<EmailSendResult> {
    if (!this.transporter || !this.fromAddress) {
      return {
        success: false,
        skipped: true,
        error: 'Email adapter not configured',
      };
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email send error';
      this.logger.error(`Failed to send email: ${message}`);
      return { success: false, error: message };
    }
  }
}
