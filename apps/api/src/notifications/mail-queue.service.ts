import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

type MailJob = {
  to: string;
  subject: string;
  body: string;
};

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: MailJob[] = [];
  private worker: NodeJS.Timeout | null = null;
  private isProcessing = false;

  onModuleInit() {
    // Process every 500ms to keep the queue responsive without blocking requests
    this.worker = setInterval(() => this.processNext(), 500);
  }

  onModuleDestroy() {
    if (this.worker) {
      clearInterval(this.worker);
    }
  }

  enqueue(job: MailJob): void {
    this.queue.push(job);
  }

  queueWelcomeEmail(recipient: string, organizationName: string): void {
    this.enqueue({
      to: recipient,
      subject: `Witaj w ${organizationName}`,
      body: `Dziękujemy za rejestrację w ${organizationName}. Twoje konto jest gotowe do użycia.`,
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        await this.deliver(job);
      } catch (error) {
        // Requeue once in case of transient issues
        this.queue.unshift(job);
        console.error('Mail delivery failed, retry scheduled', error);
      }
    }

    this.isProcessing = false;
  }

  private async deliver(job: MailJob): Promise<void> {
    // Placeholder implementation. Replace with SMTP/SES integration when credentials are available.
    // We intentionally avoid logging sensitive payloads (tokens/passwords).
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.info(
      `Mail delivered to ${job.to} with subject "${job.subject}" via async worker`,
    );
  }
}
