import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeeContractsController } from './employee-contracts.controller';
import { EmployeeContractsService } from './employee-contracts.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EmployeeContractsController],
  providers: [EmployeeContractsService],
  exports: [EmployeeContractsService],
})
export class EmployeeContractsModule {}
