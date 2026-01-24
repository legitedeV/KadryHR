import { Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { RcpService } from "./rcp.service";
import { ListEntriesDto } from "./dto/list-entries.dto";

@Controller("rcp")
@UseGuards(JwtAuthGuard)
export class RcpController {
  constructor(private readonly rcpService: RcpService) {}

  @Post("clock-in")
  clockIn(@Req() req: { user: AuthUser }) {
    return this.rcpService.clockIn(req.user.userId, req.user.organizationId);
  }

  @Post("clock-out")
  clockOut(@Req() req: { user: AuthUser }) {
    return this.rcpService.clockOut(req.user.userId, req.user.organizationId);
  }

  @Get("entries")
  list(@Req() req: { user: AuthUser }, @Query() query: ListEntriesDto) {
    return this.rcpService.list(req.user.organizationId, query);
  }
}
