import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ShiftsService } from "./shifts.service";
import { ListShiftsDto } from "./dto/list-shifts.dto";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { UpdateShiftDto } from "./dto/update-shift.dto";
import { CurrentOrganization } from "../auth/auth.decorators";

@Controller("shifts")
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  list(@CurrentOrganization() organizationId: string, @Query() query: ListShiftsDto) {
    return this.shiftsService.list(organizationId, query);
  }

  @Post()
  create(@CurrentOrganization() organizationId: string, @Body() body: CreateShiftDto) {
    return this.shiftsService.create(organizationId, body);
  }

  @Patch(":id")
  update(
    @CurrentOrganization() organizationId: string,
    @Param("id") id: string,
    @Body() body: UpdateShiftDto
  ) {
    return this.shiftsService.update(organizationId, id, body);
  }

  @Delete(":id")
  remove(@CurrentOrganization() organizationId: string, @Param("id") id: string) {
    return this.shiftsService.remove(organizationId, id);
  }
}
