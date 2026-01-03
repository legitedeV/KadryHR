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
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string | null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const host = this.configService.get('email.host', { infer: true });
    const port = this.configService.get('email.port', { infer: true });
    const user = this.configService.get('email.user', { infer: true });
    const pass = this.configService.get('email.pass', { infer: true });
    const from = this.configService.get('email.from', { infer: true });

    if (host && port && user && pass && from) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.fromAddress = from;
    } else {
      this.transporter = null;
      this.fromAddress = null;
      this.logger.warn(
        'Email adapter not configured - skipping email delivery',
      );
    }
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
