import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { RcpService } from "./rcp.service";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { ManualEntryDto } from "./dto/manual-entry.dto";
import { CurrentOrganization, CurrentUser } from "../auth/auth.decorators";

@Controller("rcp")
@UseGuards(JwtAuthGuard)
export class RcpController {
  constructor(private readonly rcpService: RcpService) {}

  @Post("clock-in")
  clockIn(@CurrentUser() user: AuthUser) {
    return this.rcpService.clockIn(user.organizationId, user.userId);
  }

  @Post("clock-out")
  clockOut(@CurrentUser() user: AuthUser) {
    return this.rcpService.clockOut(user.organizationId, user.userId);
  }

  @Get()
  list(@CurrentOrganization() organizationId: string, @Query() query: ListEntriesDto) {
    return this.rcpService.list(organizationId, query);
  }

  @Post("manual")
  manual(@CurrentUser() user: AuthUser, @Body() body: ManualEntryDto) {
    return this.rcpService.manual(user.organizationId, user.role, body);
  }
}
