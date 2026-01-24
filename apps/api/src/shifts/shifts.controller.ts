import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { ShiftsService } from "./shifts.service";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { UpdateShiftDto } from "./dto/update-shift.dto";
import { ListShiftsDto } from "./dto/list-shifts.dto";

@Controller("shifts")
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  list(@Req() req: { user: AuthUser }, @Query() query: ListShiftsDto) {
    return this.shiftsService.list(req.user.organizationId, query);
  }

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() body: CreateShiftDto) {
    return this.shiftsService.create(req.user.organizationId, body);
  }

  @Patch(":id")
  update(
    @Req() req: { user: AuthUser },
    @Param("id") id: string,
    @Body() body: UpdateShiftDto
  ) {
    return this.shiftsService.update(req.user.organizationId, id, body);
  }

  @Delete(":id")
  remove(@Req() req: { user: AuthUser }, @Param("id") id: string) {
    return this.shiftsService.remove(req.user.organizationId, id);
  }
}
