import { forwardRef } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { OrgEmployeesController } from './org-employees.controller';
import { EmployeesService } from './employees.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeeOrderIdempotencyService } from './employee-order-idempotency.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [EmployeesController, OrgEmployeesController],
  providers: [EmployeesService, EmployeeOrderIdempotencyService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
