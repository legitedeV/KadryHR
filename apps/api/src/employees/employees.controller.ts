import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CurrentOrganization, CurrentUser } from "../auth/auth.decorators";

@Controller("employees")
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  list(@CurrentOrganization() organizationId: string) {
    return this.employeesService.list(organizationId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEmployeeDto) {
    return this.employeesService.create(user.organizationId, user.role, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateEmployeeDto
  ) {
    return this.employeesService.update(user.organizationId, user.role, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.employeesService.remove(user.organizationId, user.role, id);
  }
}
