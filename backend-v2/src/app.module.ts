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
import { ScheduleTemplatesModule } from './schedule-templates/schedule-templates.module';
import { LeadsModule } from './leads/leads.module';
import { AvatarsModule } from './avatars/avatars.module';

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
    ScheduleTemplatesModule,
    LeadsModule,
    AvatarsModule,
  ],
})
export class AppModule {}
