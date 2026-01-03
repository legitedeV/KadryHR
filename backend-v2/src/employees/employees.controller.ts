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
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { Permission } from '../auth/permissions';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /**
   * Lista pracowników.
   * - OWNER/MANAGER: pełna lista z paginacją.
   * - EMPLOYEE: widzi tylko siebie (jeżeli ma powiązany rekord Employee).
   */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryEmployeesDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.employeesService.findByUser(
        user.organisationId,
        user.id,
      );

      if (!employee) {
        return {
          data: [],
          total: 0,
          skip: 0,
          take: query.take ?? query.pageSize ?? 20,
        };
      }

      return this.employeesService.findAll(user.organisationId, query, {
        restrictToEmployeeId: employee.id,
      });
    }

    return this.employeesService.findAll(user.organisationId, query);
  }

  /**
   * Szczegóły pojedynczego pracownika.
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.employeesService.findOne(user.organisationId, id);
  }

  /**
   * Tworzenie pracownika – tylko OWNER/MANAGER.
   */
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post()
  @AuditLog({
    action: 'EMPLOYEE_CREATE',
    entityType: 'employee',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.organisationId, dto);
  }

  /**
   * Aktualizacja pracownika – tylko OWNER/MANAGER.
   */
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Patch(':id')
  @AuditLog({
    action: 'EMPLOYEE_UPDATE',
    entityType: 'employee',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(user.organisationId, id, dto);
  }

  /**
   * Usunięcie pracownika – tylko OWNER/MANAGER.
   */
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Delete(':id')
  @AuditLog({
    action: 'EMPLOYEE_DELETE',
    entityType: 'employee',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.employeesService.remove(user.organisationId, id);
  }
}
