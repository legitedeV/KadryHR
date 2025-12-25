import { Global, Module } from '@nestjs/common';
import { MailQueueService } from './mail-queue.service';

@Global()
@Module({
  providers: [MailQueueService],
  exports: [MailQueueService],
})
export class NotificationsModule {}
