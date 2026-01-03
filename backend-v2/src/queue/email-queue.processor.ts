import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailDeliveryJob } from './queue.service';
import { EmailAdapter } from '../email/email.adapter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDeliveryStatus } from '@prisma/client';

@Processor('email-delivery')
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly emailAdapter: EmailAdapter,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<EmailDeliveryJob>): Promise<void> {
    const { notificationId, to, subject, text, html } = job.data;

    this.logger.log(
      `Processing email delivery job for notification ${notificationId}`,
    );

    const result = await this.emailAdapter.sendEmail({
      to,
      subject,
      text,
      html,
    });

    let status: NotificationDeliveryStatus;
    let errorMessage: string | null = null;

    if (result.success) {
      status = NotificationDeliveryStatus.SENT;
      this.logger.log(
        `Email sent successfully for notification ${notificationId}`,
      );
    } else if (result.skipped) {
      status = NotificationDeliveryStatus.SKIPPED;
      errorMessage = result.error ?? 'Email adapter not configured';
      this.logger.warn(
        `Email skipped for notification ${notificationId}: ${errorMessage}`,
      );
    } else {
      status = NotificationDeliveryStatus.FAILED;
      errorMessage = result.error ?? 'Email delivery failed';
      this.logger.error(
        `Email failed for notification ${notificationId}: ${errorMessage}`,
      );
      throw new Error(errorMessage); // This will trigger retry
    }

    // Update delivery attempt record
    await this.prisma.notificationDeliveryAttempt.updateMany({
      where: {
        notificationId,
      },
      data: {
        status,
        errorMessage,
      },
    });
  }
}
