import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { LogoProposalsController } from './logo-proposals.controller';
import { LogoProposalsService } from './logo-proposals.service';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, EmailModule],
  controllers: [LogoProposalsController],
  providers: [LogoProposalsService],
  exports: [LogoProposalsService],
})
export class LogoProposalsModule {}
