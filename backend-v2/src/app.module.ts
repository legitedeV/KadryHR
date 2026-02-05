import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigValidationModule } from './config/config-validation.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { LocationsModule } from './locations/locations.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AvailabilityModule } from './availability/availability.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ContractsModule } from './contracts/contracts.module';
import { PayrollModule } from './payroll/payroll.module';
import { DocumentsModule } from './documents/documents.module';
import { EmployeeContractsModule } from './employee-contracts/employee-contracts.module';
import { ScheduleTemplatesModule } from './schedule-templates/schedule-templates.module';
import { LeadsModule } from './leads/leads.module';
import { AvatarsModule } from './avatars/avatars.module';
import { ShiftPresetsModule } from './shift-presets/shift-presets.module';
import { ShiftSwapsModule } from './shift-swaps/shift-swaps.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WebsiteModule } from './website/website.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { HealthController } from './health/health.controller';
import { ScheduleModule } from './schedule/schedule.module';
import { RcpModule } from './rcp/rcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'uploads'),
      serveRoot: '/static',
      serveStaticOptions: {
        index: false,
      },
    }),
    ConfigValidationModule,
    PrismaModule,
    AuthModule,
    OrganisationsModule,
    UsersModule,
    EmployeesModule,
    LocationsModule,
    ShiftsModule,
    AvailabilityModule,
    LeaveRequestsModule,
    LeaveTypesModule,
    NotificationsModule,
    EmailModule,
    SmsModule,
    NewsletterModule,
    ContractsModule,
    PayrollModule,
    DocumentsModule,
    EmployeeContractsModule,
    ScheduleTemplatesModule,
    LeadsModule,
    AvatarsModule,
    ShiftPresetsModule,
    ShiftSwapsModule,
    AdminModule,
    ReportsModule,
    SubscriptionsModule,
    WebsiteModule,
    PlatformConfigModule,
    ScheduleModule,
    RcpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
