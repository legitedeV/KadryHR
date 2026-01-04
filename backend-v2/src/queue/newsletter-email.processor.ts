import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NewsletterEmailJob } from './queue.service';
import { EmailAdapter } from '../email/email.adapter';

@Processor('newsletter-email')
export class NewsletterEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(NewsletterEmailProcessor.name);

  constructor(private readonly emailAdapter: EmailAdapter) {
    super();
  }

  async process(job: Job<NewsletterEmailJob>): Promise<void> {
    const { to, subject, text, html } = job.data;

    const result = await this.emailAdapter.sendEmail({
      to,
      subject,
      text,
      html,
    });

    if (!result.success && !result.skipped) {
      this.logger.error(`Newsletter email failed for ${to}: ${result.error}`);
      throw new Error(result.error ?? 'Email delivery failed');
    }

    if (result.skipped) {
      this.logger.warn(`Newsletter email skipped for ${to}: ${result.error}`);
    }
  }
}
