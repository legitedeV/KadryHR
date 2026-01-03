import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { QueueModule } from '../queue/queue.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailAdapter } from './email.adapter';
import { CampaignService } from './campaign.service';

@Module({
  imports: [PrismaModule, AuditModule, QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, CampaignService, EmailAdapter],
  exports: [NotificationsService, CampaignService],
})
export class NotificationsModule {}
