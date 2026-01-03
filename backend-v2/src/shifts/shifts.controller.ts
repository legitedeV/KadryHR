import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

@UseGuards(JwtAuthGuard, RolesGuard)
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
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.employeesService.findByUser(
        user.organisationId,
        user.id,
      );

      if (!employee) {
        return [];
      }

      return this.shiftsService.findForEmployee(
        user.organisationId,
        employee.id,
      );
    }

    return this.shiftsService.findAll(user.organisationId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftDto,
  ) {
    return this.shiftsService.create(user.organisationId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftsService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.shiftsService.remove(user.organisationId, id);
  }
}
