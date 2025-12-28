import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigValidationModule } from './config/config-validation.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { UsersModule } from './users/users.module';
import { AvailabilityModule } from './availability/availability.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LocationsModule } from './locations/locations.module';
import { EmployeesModule } from './employees/employees.module';
import { EmployeesModule } from './employees/employees.module';
import { LocationsModule } from './locations/locations.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AvailabilityModule } from './availability/availability.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConfigValidationModule,
    PrismaModule,
    AuthModule,
    OrganisationsModule,
    UsersModule,
    EmployeesModule,
    LocationsModule,
    ShiftsModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
