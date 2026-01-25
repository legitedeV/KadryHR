import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReportsService } from "./reports.service";
import { TimesheetQueryDto } from "./dto/timesheet-query.dto";
import { CurrentOrganization } from "../auth/auth.decorators";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("timesheets")
  timesheets(@CurrentOrganization() organizationId: string, @Query() query: TimesheetQueryDto) {
    return this.reportsService.timesheets(organizationId, query);
  }
}
