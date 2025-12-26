import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { VersionModule } from './version/version.module';
import { ScheduleModule } from './schedule/schedule.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmployeesModule } from './employees/employees.module';
import { InvitesModule } from './invites/invites.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    AuthModule,
    HealthModule,
    VersionModule,
    ScheduleModule,
    DashboardModule,
    EmployeesModule,
    InvitesModule,
    PermissionsModule,
  ],
})
export class AppModule {}
