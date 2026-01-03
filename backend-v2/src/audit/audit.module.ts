import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditLogInterceptor } from './audit-log.interceptor';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditLogInterceptor],
  exports: [AuditService, AuditLogInterceptor],
})
export class AuditModule {}
