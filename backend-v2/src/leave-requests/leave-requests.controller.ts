import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { FindLeaveRequestsQueryDto } from './dto/find-leave-requests-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

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
        employeeId: employee.id,
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
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
<<<<<<< HEAD

      return this.leaveRequestsService.findOne(user.organisationId, id, {
        employeeId: employee.id,
        actorUserId: user.id,
        actorRole: user.role,
=======
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      return this.leaveRequestsService.findOne(user.organisationId, id, {
        restrictToEmployeeId: employee.id,
>>>>>>> 5a624e43de8bfe415675dcdf7a3b0199d8b33b9a
      });
    }

    return this.leaveRequestsService.findOne(user.organisationId, id, {
      actorUserId: user.id,
      actorRole: user.role,
    });
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
<<<<<<< HEAD
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      return this.leaveRequestsService.create(user.organisationId, employee.id, dto);
    }

    // OWNER / MANAGER can create for an employee (employeeId required)
    if (!dto.employeeId) {
      throw new BadRequestException('employeeId is required for manager/owner creation');
    }

    return this.leaveRequestsService.create(user.organisationId, dto.employeeId, dto);
=======
    return this.leaveRequestsService.create(user.organisationId, dto, {
      userId: user.id,
      role: user.role,
    });
>>>>>>> 5a624e43de8bfe415675dcdf7a3b0199d8b33b9a
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );

      return this.leaveRequestsService.update(user.organisationId, id, dto, {
        employeeId: employee.id,
        actorUserId: user.id,
        actorRole: user.role,
      });
    }

<<<<<<< HEAD
    return this.leaveRequestsService.update(user.organisationId, id, dto, {
      actorUserId: user.id,
      actorRole: user.role,
    });
=======
    return this.leaveRequestsService.update(
      user.organisationId,
      id,
      dto,
      scope,
    );
>>>>>>> 5a624e43de8bfe415675dcdf7a3b0199d8b33b9a
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestStatusDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );

      // employee is only allowed to cancel
      if (dto.status !== 'CANCELLED') {
        throw new BadRequestException('Employees can only cancel leave requests');
      }

      return this.leaveRequestsService.updateStatus(user.organisationId, id, dto, {
        employeeId: employee.id,
        actorUserId: user.id,
        actorRole: user.role,
      });
    }

    // OWNER / MANAGER can approve/reject (and optionally cancel)
    return this.leaveRequestsService.updateStatus(user.organisationId, id, dto, {
      actorUserId: user.id,
      actorRole: user.role,
    });
  }
}
