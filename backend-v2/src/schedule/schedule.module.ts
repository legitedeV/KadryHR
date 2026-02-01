import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleRepository } from './schedule.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeeContractsModule } from '../employee-contracts/employee-contracts.module';
import { ScheduleCostService } from './schedule-cost.service';

@Module({
  imports: [PrismaModule, NotificationsModule, EmployeeContractsModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleRepository, ScheduleCostService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
