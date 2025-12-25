import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleController, AssignmentController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleController, AssignmentController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
