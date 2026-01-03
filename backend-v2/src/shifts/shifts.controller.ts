import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { EmployeesService } from '../employees/employees.service';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly employeesService: EmployeesService,
  ) {}

  /**
   * Lista zmian:
   * - OWNER/MANAGER: wszystkie w organizacji
   * - EMPLOYEE: tylko swoje zmiany
   */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryShiftsDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.employeesService.findByUser(
        user.organisationId,
        user.id,
      );

      if (!employee) {
        return [];
      }

      return this.shiftsService.findForEmployee(user.organisationId, query, {
        employeeId: employee.id,
      });
    }

    return this.shiftsService.findAll(user.organisationId, query);
  }

  @Get('summary')
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryShiftsDto,
  ) {
    return this.shiftsService.summary(user.organisationId, query);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  @AuditLog({
    action: 'SHIFT_CREATE',
    entityType: 'shift',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftDto,
  ) {
    return this.shiftsService.create(user.organisationId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  @AuditLog({
    action: 'SHIFT_UPDATE',
    entityType: 'shift',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftsService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(':id')
  @AuditLog({
    action: 'SHIFT_DELETE',
    entityType: 'shift',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.shiftsService.remove(user.organisationId, id);
  }
}
