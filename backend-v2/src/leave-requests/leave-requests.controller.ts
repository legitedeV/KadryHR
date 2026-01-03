import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaveStatus, Role } from '@prisma/client';
import { LeaveRequestsService } from './leave-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryLeaveRequestsDto,
  ) {
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      return this.leaveRequestsService.findAll(user.organisationId, query, {
        restrictToEmployeeId: employee.id,
      });
    }

    return this.leaveRequestsService.findAll(user.organisationId, query);
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
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      return this.leaveRequestsService.findOne(user.organisationId, id, {
        restrictToEmployeeId: employee.id,
      });
    }

    return this.leaveRequestsService.findOne(user.organisationId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
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
    let scope:
      | {
          restrictToEmployeeId: string;
        }
      | undefined;

    if (user.role === Role.EMPLOYEE) {
      const employee = await this.leaveRequestsService.findEmployeeForUser(
        user.organisationId,
        user.id,
      );
      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }
      scope = { restrictToEmployeeId: employee.id, userId: user.id };
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
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    if (
      user.role === Role.EMPLOYEE &&
      dto.status === LeaveStatus.CANCELLED
    ) {
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
        { restrictToEmployeeId: employee.id },
      );
    }

    if (![Role.OWNER, Role.MANAGER, Role.ADMIN].includes(user.role)) {
      throw new NotFoundException('Not authorised');
    }

    return this.leaveRequestsService.updateStatus(
      user.organisationId,
      id,
      dto,
      user.id,
    );
  }
}
