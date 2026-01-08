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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { EmployeesService } from '../employees/employees.service';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { ClearWeekDto } from './dto/clear-week.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { Permission } from '../auth/permissions';

@UseGuards(JwtAuthGuard, PermissionsGuard)
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

  @RequirePermissions(Permission.RCP_EDIT)
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

  @RequirePermissions(Permission.RCP_EDIT)
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

  @RequirePermissions(Permission.RCP_EDIT)
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

  /**
   * Publish schedule - notify affected employees about their shifts
   */
  @RequirePermissions(Permission.RCP_EDIT)
  @Post('publish-schedule')
  @AuditLog({
    action: 'SCHEDULE_PUBLISH',
    entityType: 'schedule',
    captureBody: true,
  })
  async publishSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      employeeIds: string[];
      dateRange?: { from: string; to: string };
    },
  ) {
    const dateRange = body.dateRange
      ? {
          from: new Date(body.dateRange.from),
          to: new Date(body.dateRange.to),
        }
      : undefined;

    await this.shiftsService.notifySchedulePublished(
      user.organisationId,
      body.employeeIds,
      dateRange,
    );

    return {
      success: true,
      notified: body.employeeIds.length,
    };
  }

  /**
   * Clear all shifts for a given week (date range)
   * Requires SCHEDULE_MANAGE permission (Owner/Manager only)
   */
  @RequirePermissions(Permission.RCP_EDIT)
  @Post('clear-week')
  @AuditLog({
    action: 'SCHEDULE_CLEAR_WEEK',
    entityType: 'schedule',
    captureBody: true,
  })
  async clearWeek(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ClearWeekDto,
  ) {
    const dateRange = {
      from: new Date(dto.from),
      to: new Date(dto.to),
    };

    const result = await this.shiftsService.clearWeek(
      user.organisationId,
      dateRange,
      dto.locationId,
    );

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }
}
