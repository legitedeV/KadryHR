import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
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
          items: [],
          total: 0,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
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
  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.organisationId, dto);
  }

  /**
   * Aktualizacja pracownika – tylko OWNER/MANAGER.
   */
  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
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
  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.employeesService.remove(user.organisationId, id);
  }
}
