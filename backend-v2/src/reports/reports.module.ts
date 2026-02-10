import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganisationModuleGuard } from '../common/guards/organisation-module.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, OrganisationModuleGuard],
  exports: [ReportsService],
})
export class ReportsModule {}
