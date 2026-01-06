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
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAvailabilityDto,
  ) {
    return this.availabilityService.findAll(user.organisationId, query);
  }

  @Post()
  @AuditLog({
    action: 'AVAILABILITY_CREATE',
    entityType: 'availability',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAvailabilityDto,
  ) {
    // If user is an employee, they can only create availability for themselves
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.availabilityService.findEmployeeByUserId(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      // Force employeeId to be the current user's employee record
      dto.employeeId = employee.id;
    }

    return this.availabilityService.create(user.organisationId, dto);
  }

  @Post('bulk')
  @AuditLog({
    action: 'AVAILABILITY_BULK_UPSERT',
    entityType: 'availability',
    captureBody: true,
  })
  async bulkUpsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      employeeId?: string;
      availabilities: Array<{
        weekday?: string;
        date?: string;
        startMinutes: number;
        endMinutes: number;
        notes?: string;
      }>;
    },
  ) {
    let targetEmployeeId = dto.employeeId;

    // If user is an employee, they can only update their own availability
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.availabilityService.findEmployeeByUserId(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      targetEmployeeId = employee.id;
    } else if (!targetEmployeeId) {
      throw new ForbiddenException(
        'employeeId is required for manager/admin operations',
      );
    }

    return this.availabilityService.bulkUpsertForEmployee(
      user.organisationId,
      targetEmployeeId,
      dto.availabilities,
    );
  }

  @Patch(':id')
  @AuditLog({
    action: 'AVAILABILITY_UPDATE',
    entityType: 'availability',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    // If user is an employee, verify they own this availability
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.availabilityService.findEmployeeByUserId(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      // We need to verify the availability belongs to this employee
      // This is done in the service layer
      dto.employeeId = employee.id;
    }

    return this.availabilityService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Delete(':id')
  @AuditLog({
    action: 'AVAILABILITY_DELETE',
    entityType: 'availability',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.availabilityService.remove(user.organisationId, id);
  }
}
