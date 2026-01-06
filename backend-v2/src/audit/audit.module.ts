import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditLogInterceptor],
  exports: [AuditService, AuditLogInterceptor],
})
export class AuditModule {}
