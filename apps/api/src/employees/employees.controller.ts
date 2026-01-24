import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

@Controller("employees")
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  list(@Req() req: { user: AuthUser }) {
    return this.employeesService.list(req.user.organizationId);
  }

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() body: CreateEmployeeDto) {
    return this.employeesService.create(req.user.organizationId, req.user.role, body);
  }

  @Patch(":id")
  update(
    @Req() req: { user: AuthUser },
    @Param("id") id: string,
    @Body() body: UpdateEmployeeDto
  ) {
    return this.employeesService.update(req.user.organizationId, req.user.role, id, body);
  }

  @Delete(":id")
  remove(@Req() req: { user: AuthUser }, @Param("id") id: string) {
    return this.employeesService.remove(req.user.organizationId, req.user.role, id);
  }
}
