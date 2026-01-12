import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { CreateAvailabilityWindowDto } from './dto/create-availability-window.dto';
import { UpdateAvailabilityWindowDto } from './dto/update-availability-window.dto';
import { SubmitAvailabilityWindowDto } from './dto/submit-availability-window.dto';
import { UpdateAvailabilitySubmissionStatusDto } from './dto/update-availability-submission-status.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ==========================================
  // CURRENT USER AVAILABILITY ENDPOINTS
  // ==========================================

  /**
   * Get current user's availability
   */
  @Get('me')
  async getMyAvailability(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.getMyAvailability(
      user.organisationId,
      user.id,
    );
  }

  /**
   * Update current user's availability
   */
  @Put('me')
  @AuditLog({
    action: 'AVAILABILITY_UPDATE_OWN',
    entityType: 'availability',
    captureBody: true,
  })
  async updateMyAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    dto: {
      availabilities: Array<{
        weekday?: string;
        date?: string;
        startMinutes: number;
        endMinutes: number;
        notes?: string;
      }>;
    },
  ) {
    return this.availabilityService.updateMyAvailability(
      user.organisationId,
      user.id,
      dto.availabilities,
    );
  }

  // ==========================================
  // AVAILABILITY WINDOW SUBMISSIONS (Employee)
  // ==========================================

  @Get('windows/:windowId/me')
  async getMyWindowAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
  ) {
    return this.availabilityService.getWindowAvailabilityForEmployee(
      user.organisationId,
      user.id,
      windowId,
    );
  }

  @Put('windows/:windowId/me')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_SUBMISSION',
    entityType: 'availability_submission',
    captureBody: true,
  })
  async submitMyWindowAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Body() dto: SubmitAvailabilityWindowDto,
  ) {
    return this.availabilityService.saveWindowAvailabilityForEmployee(
      user.organisationId,
      user.id,
      windowId,
      dto.availabilities,
      dto.submit,
    );
  }

  // ==========================================
  // AVAILABILITY WINDOW SUBMISSIONS (Admin)
  // ==========================================

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('windows/:windowId/team/stats')
  async getWindowTeamStats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
  ) {
    return this.availabilityService.getWindowTeamAvailabilityStats(
      user.organisationId,
      windowId,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('windows/:windowId/team')
  async getWindowTeamAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.availabilityService.getWindowTeamAvailability(
      user.organisationId,
      windowId,
      {
        search,
        locationId,
        role,
        page: page ? parseInt(page, 10) : undefined,
        perPage: perPage ? parseInt(perPage, 10) : undefined,
      },
    );
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('windows/:windowId/employee/:employeeId')
  async getWindowEmployeeAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.availabilityService.getWindowEmployeeAvailability(
      user.organisationId,
      windowId,
      employeeId,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Put('windows/:windowId/employee/:employeeId')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_ADMIN_UPDATE',
    entityType: 'availability_submission',
    entityIdParam: 'employeeId',
    captureBody: true,
  })
  async updateWindowEmployeeAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: SubmitAvailabilityWindowDto,
  ) {
    return this.availabilityService.updateWindowAvailabilityForEmployee(
      user.organisationId,
      windowId,
      employeeId,
      dto.availabilities,
      user.id,
    );
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Patch('windows/:windowId/employee/:employeeId/status')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_STATUS_UPDATE',
    entityType: 'availability_submission',
    entityIdParam: 'employeeId',
    captureBody: true,
  })
  async updateWindowSubmissionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateAvailabilitySubmissionStatusDto,
  ) {
    return this.availabilityService.updateSubmissionStatus(
      user.organisationId,
      windowId,
      employeeId,
      dto.status,
      user.id,
    );
  }

  // ==========================================
  // TEAM AVAILABILITY ENDPOINTS (Admin)
  // ==========================================

  /**
   * Get team availability statistics
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('team/stats')
  async getTeamStats(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.getTeamAvailabilityStats(
      user.organisationId,
    );
  }

  /**
   * Get list of employees with availability summary
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('employees')
  async getTeamAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.availabilityService.getTeamAvailability(user.organisationId, {
      search,
      locationId,
      role,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  /**
   * Get detailed availability for a specific employee
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('employee/:employeeId')
  async getEmployeeAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
  ) {
    return this.availabilityService.getEmployeeAvailability(
      user.organisationId,
      employeeId,
    );
  }

  /**
   * Update availability for a specific employee (admin only)
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Put('employee/:employeeId')
  @AuditLog({
    action: 'AVAILABILITY_UPDATE_EMPLOYEE',
    entityType: 'availability',
    entityIdParam: 'employeeId',
    captureBody: true,
  })
  async updateEmployeeAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Body()
    dto: {
      availabilities: Array<{
        weekday?: string;
        date?: string;
        startMinutes: number;
        endMinutes: number;
        notes?: string;
      }>;
    },
  ) {
    return this.availabilityService.updateEmployeeAvailability(
      user.organisationId,
      employeeId,
      dto.availabilities,
    );
  }

  // ==========================================
  // GENERAL AVAILABILITY ENDPOINTS
  // ==========================================

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

  // ==========================================
  // AVAILABILITY WINDOWS ENDPOINTS (Task 1)
  // ==========================================

  /**
   * Get all availability windows (managers/admins)
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Get('windows')
  async findAllWindows(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.findAllWindows(user.organisationId);
  }

  /**
   * Get active (open) availability windows - accessible by all users
   */
  @Get('windows/active')
  async findActiveWindows(@CurrentUser() user: AuthenticatedUser) {
    return this.availabilityService.findActiveWindows(user.organisationId);
  }

  /**
   * Get a specific availability window
   */
  @Get('windows/:windowId')
  async findWindowById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
  ) {
    return this.availabilityService.findWindowById(
      user.organisationId,
      windowId,
    );
  }

  /**
   * Create a new availability window (managers/admins only)
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Post('windows')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_CREATE',
    entityType: 'availability_window',
    captureBody: true,
  })
  async createWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAvailabilityWindowDto,
  ) {
    return this.availabilityService.createWindow(user.organisationId, dto);
  }

  /**
   * Update an availability window (managers/admins only)
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Patch('windows/:windowId')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_UPDATE',
    entityType: 'availability_window',
    entityIdParam: 'windowId',
    fetchBefore: true,
    captureBody: true,
  })
  async updateWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
    @Body() dto: UpdateAvailabilityWindowDto,
  ) {
    return this.availabilityService.updateWindow(
      user.organisationId,
      windowId,
      dto,
    );
  }

  /**
   * Delete an availability window (managers/admins only)
   */
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Delete('windows/:windowId')
  @AuditLog({
    action: 'AVAILABILITY_WINDOW_DELETE',
    entityType: 'availability_window',
    entityIdParam: 'windowId',
    fetchBefore: true,
  })
  async deleteWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('windowId') windowId: string,
  ) {
    return this.availabilityService.deleteWindow(user.organisationId, windowId);
  }
}
