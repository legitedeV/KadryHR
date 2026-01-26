import { Module } from '@nestjs/common';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveBalanceService } from './leave-balance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditModule, EmployeesModule],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService, LeaveBalanceService],
  exports: [LeaveRequestsService, LeaveBalanceService],
})
export class LeaveRequestsModule {}
