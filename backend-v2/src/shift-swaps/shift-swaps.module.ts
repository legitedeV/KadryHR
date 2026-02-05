import { Module } from '@nestjs/common';
import { ShiftSwapsController } from './shift-swaps.controller';
import { ShiftSwapsService } from './shift-swaps.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [PrismaModule, EmployeesModule],
  controllers: [ShiftSwapsController],
  providers: [ShiftSwapsService],
  exports: [ShiftSwapsService],
})
export class ShiftSwapsModule {}
