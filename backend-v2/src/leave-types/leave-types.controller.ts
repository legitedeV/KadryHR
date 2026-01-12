import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-types')
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.leaveTypesService.list(user.organisationId);
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveTypeDto,
  ) {
    return this.leaveTypesService.create(user.organisationId, dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypesService.update(user.organisationId, id, dto);
  }
}
