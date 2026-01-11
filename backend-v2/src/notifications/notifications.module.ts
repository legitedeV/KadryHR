import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { QueueModule } from '../queue/queue.module';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { CampaignService } from './campaign.service';

@Module({
  imports: [PrismaModule, AuditModule, QueueModule, EmailModule, SmsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, CampaignService],
  exports: [NotificationsService, CampaignService],
})
export class NotificationsModule {}
