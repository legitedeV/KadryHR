import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgContext, RequestWithAuth } from '../common/interfaces/request-with-auth.interface';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SearchEmployeesDto } from './dto/search-employees.dto';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async list(
    @OrgContextDecorator() orgContext: OrgContext,
    @Query() query: SearchEmployeesDto,
  ) {
    return this.employeesService.list(orgContext.orgId, query);
  }

  @Get('status')
  async status(@OrgContextDecorator() orgContext: OrgContext) {
    return this.employeesService.getStatus(orgContext.orgId);
  }

  @Get(':id')
  async get(@Param('id') id: string, @OrgContextDecorator() orgContext: OrgContext) {
    return this.employeesService.get(orgContext.orgId, id);
  }

  @Post()
  async create(
    @Body() dto: CreateEmployeeDto,
    @Req() request: RequestWithAuth,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.employeesService.create(orgContext.orgId, dto, request.user?.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.employeesService.update(orgContext.orgId, id, dto);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string, @OrgContextDecorator() orgContext: OrgContext) {
    return this.employeesService.deactivate(orgContext.orgId, id);
  }
}
