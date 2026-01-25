import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { ShiftsService } from "./shifts.service";
import { ListShiftsDto } from "./dto/list-shifts.dto";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { UpdateShiftDto } from "./dto/update-shift.dto";
import { CurrentOrganization, CurrentUser } from "../auth/auth.decorators";

@Controller("shifts")
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  list(@CurrentOrganization() organizationId: string, @Query() query: ListShiftsDto) {
    return this.shiftsService.list(organizationId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateShiftDto) {
    return this.shiftsService.create(user.organizationId, user.role, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateShiftDto
  ) {
    return this.shiftsService.update(user.organizationId, user.role, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.shiftsService.remove(user.organizationId, user.role, id);
  }
}
