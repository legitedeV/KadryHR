import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface EmailDeliveryJob {
  notificationId?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  organisationId: string;
  userId: string;
}

export interface NewsletterEmailJob {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queueAvailable = true;

  constructor(
    @InjectQueue('email-delivery')
    private readonly emailQueue: Queue<EmailDeliveryJob>,
    @InjectQueue('newsletter-email')
    private readonly newsletterQueue: Queue<NewsletterEmailJob>,
  ) {
    // Check if queue is available
    this.checkQueueAvailability();
  }

  private async checkQueueAvailability() {
    try {
      const client = await this.emailQueue.client;
      await client.ping();
      this.queueAvailable = true;
      this.logger.log('Email delivery queue connected successfully');
    } catch (err) {
      this.queueAvailable = false;
      this.logger.warn(
        `Email delivery queue not available: ${err instanceof Error ? err.message : 'Unknown error'}. Email notifications will be processed synchronously.`,
      );
    }
  }

  async addEmailDeliveryJob(data: EmailDeliveryJob): Promise<boolean> {
    if (!this.queueAvailable) {
      this.logger.warn(
        'Queue not available, skipping email delivery job for notification: ' +
          data.notificationId,
      );
      return false;
    }

    try {
      await this.emailQueue.add('send-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to add email delivery job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  isQueueAvailable(): boolean {
    return this.queueAvailable;
  }

  async addNewsletterEmailJob(data: NewsletterEmailJob): Promise<boolean> {
    if (!this.queueAvailable) {
      this.logger.warn(
        'Queue not available, skipping newsletter email delivery to: ' +
          data.to,
      );
      return false;
    }

    try {
      await this.newsletterQueue.add('newsletter-email', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to add newsletter email job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
}
