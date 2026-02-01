import { forwardRef } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeesModule } from '../employees/employees.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => EmployeesModule),
    PrismaModule,
    OrganisationsModule,
    AuditModule,
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
  exports: [AvatarsService],
})
export class AvatarsModule {}
