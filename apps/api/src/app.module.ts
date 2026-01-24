import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { LeadsModule } from "./leads/leads.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { LocationsModule } from "./locations/locations.module";
import { EmployeesModule } from "./employees/employees.module";
import { ShiftsModule } from "./shifts/shifts.module";
import { RcpModule } from "./rcp/rcp.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    PrismaModule,
    LeadsModule,
    AuthModule,
    OrganizationsModule,
    LocationsModule,
    EmployeesModule,
    ShiftsModule,
    RcpModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
