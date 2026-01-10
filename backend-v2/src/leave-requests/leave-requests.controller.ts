import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaveStatus, Role } from '@prisma/client';
import { ELEVATED_ROLES, LeaveRequestsService } from './leave-requests.service';
import { LeaveBalanceService } from './leave-balance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { FindLeaveRequestsQueryDto } from './dto/find-leave-requests-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
    private readonly leaveBalanceService: LeaveBalanceService,
  ) {}

  @Get('balances')
  async getBalances(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? parseInt(year, 10) : undefined;

    if (user.role === Role.EMPLOYEE) {
      // Employees can only see their own balances
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      return this.leaveBalanceService.getEmployeeBalances(
        user.organisationId,
        employee.id,
        targetYear,
      );
    }

    // Managers/owners can see all or specific employee
    if (employeeId) {
      return this.leaveBalanceService.getEmployeeBalances(
        user.organisationId,
        employeeId,
        targetYear,
      );
    }

    return this.leaveBalanceService.getOrganisationBalances(
      user.organisationId,
      targetYear,
    );
  }

  @Patch('balances/:employeeId/:leaveTypeId')
  async adjustBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { year?: number; adjustment: number; allocated?: number },
  ) {
    if (!ELEVATED_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only managers/owners can adjust balances');
    }

    return this.leaveBalanceService.adjustBalance(
      user.organisationId,
      employeeId,
      leaveTypeId,
      body.year ?? new Date().getFullYear(),
      body.adjustment,
      body.allocated,
    );
  }

  @Get('approved')
  async getApprovedLeaves(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Return approved leaves for the schedule view
    return this.leaveRequestsService.findApprovedForSchedule(
      user.organisationId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindLeaveRequestsQueryDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );

      return this.leaveRequestsService.findAll(user.organisationId, query, {
        restrictToEmployeeId: employee.id,
        actorUserId: user.id,
        actorRole: user.role,
      });
    }

    // OWNER / MANAGER
    return this.leaveRequestsService.findAll(user.organisationId, query, {
      actorUserId: user.id,
      actorRole: user.role,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );

      return this.leaveRequestsService.findOne(user.organisationId, id, {
        restrictToEmployeeId: employee.id,
        actorUserId: user.id,
        actorRole: user.role,
      });
    }

    return this.leaveRequestsService.findOne(user.organisationId, id, {
      actorUserId: user.id,
      actorRole: user.role,
    });
  }

  @Get(':id/history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    // Verify access (will throw if not allowed)
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      await this.leaveRequestsService.findOne(user.organisationId, id, {
        restrictToEmployeeId: employee.id,
      });
    } else {
      await this.leaveRequestsService.findOne(user.organisationId, id);
    }

    return this.leaveRequestsService.getRequestHistory(user.organisationId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      return this.leaveRequestsService.create(
        user.organisationId,
        { ...dto, employeeId: employee.id },
        { userId: user.id, role: user.role },
      );
    }

    // OWNER / MANAGER can create for an employee (employeeId required)
    if (!dto.employeeId) {
      throw new BadRequestException(
        'employeeId is required for manager/owner creation',
      );
    }

    return this.leaveRequestsService.create(user.organisationId, dto, {
      userId: user.id,
      role: user.role,
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    const scope = {
      actorUserId: user.id,
      actorRole: user.role,
      restrictToEmployeeId: undefined as string | undefined,
    };

    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      scope.restrictToEmployeeId = employee.id;
    }

    return this.leaveRequestsService.update(
      user.organisationId,
      id,
      dto,
      scope,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestStatusDto,
  ) {
    if (user.role === Role.EMPLOYEE && dto.status === LeaveStatus.CANCELLED) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      return this.leaveRequestsService.updateStatus(
        user.organisationId,
        id,
        dto,
        user.id,
        {
          restrictToEmployeeId: employee.id,
          actorRole: user.role,
          actorUserId: user.id,
        },
      );
    }

    if (!ELEVATED_ROLES.includes(user.role)) {
      throw new ForbiddenException('Brak uprawnień do zmiany statusu wniosku');
    }

    return this.leaveRequestsService.updateStatus(
      user.organisationId,
      id,
      dto,
      user.id,
      { actorRole: user.role, actorUserId: user.id },
    );
  }
}
