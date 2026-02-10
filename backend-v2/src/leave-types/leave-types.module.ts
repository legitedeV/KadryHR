import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganisationModuleGuard } from '../common/guards/organisation-module.guard';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';

@Module({
  imports: [PrismaModule],
  providers: [LeaveTypesService, OrganisationModuleGuard],
  controllers: [LeaveTypesController],
  exports: [LeaveTypesService],
})
export class LeaveTypesModule {}
