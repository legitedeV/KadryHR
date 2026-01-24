import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { ReportsService } from "./reports.service";
import { TimesheetQueryDto } from "./dto/timesheet-query.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("timesheets")
  timesheets(@Req() req: { user: AuthUser }, @Query() query: TimesheetQueryDto) {
    return this.reportsService.timesheets(req.user.organizationId, query);
  }
}
