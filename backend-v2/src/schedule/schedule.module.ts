import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { GrafikController } from './grafik.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeeContractsModule } from '../employee-contracts/employee-contracts.module';
import { ScheduleCostService } from './schedule-cost.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, NotificationsModule, EmployeeContractsModule, AuditModule],
  controllers: [ScheduleController, GrafikController],
  providers: [ScheduleService, ScheduleRepository, ScheduleCostService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
