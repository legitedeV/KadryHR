import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Permission } from '../auth/permissions';
import { ScheduleService } from './schedule.service';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { CreateScheduleShiftDto } from './dto/create-schedule-shift.dto';
import { BulkCreateShiftsDto } from './dto/bulk-create-shifts.dto';
import { BulkDeleteShiftsDto } from './dto/bulk-delete-shifts.dto';
import { ValidateScheduleDto } from './dto/validate-schedule.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';
import { DuplicatePreviousPeriodDto } from './dto/duplicate-prev.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @RequirePermissions(Permission.SCHEDULE_VIEW)
  @Get()
  async getSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryScheduleDto,
  ) {
    return this.scheduleService.getSchedule(user.organisationId, query);
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Post('shifts')
  async createShift(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleShiftDto,
  ) {
    return this.scheduleService.createShift(user.organisationId, user.id, dto);
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Post('shifts/bulk')
  async createShiftsBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkCreateShiftsDto,
  ) {
    return this.scheduleService.createShiftsBulk(
      user.organisationId,
      user.id,
      dto,
    );
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Delete('shifts/bulk')
  async deleteShiftsBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkDeleteShiftsDto,
  ) {
    return this.scheduleService.deleteShiftsBulk(
      user.organisationId,
      user.id,
      dto,
    );
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Post('validate')
  async validateSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ValidateScheduleDto,
  ) {
    return this.scheduleService.validateSchedule(
      user.organisationId,
      user.id,
      dto,
    );
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Post('publish')
  async publishSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PublishScheduleDto,
  ) {
    return this.scheduleService.publishSchedule(
      user.organisationId,
      user.id,
      dto,
    );
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Post('duplicate-prev')
  async duplicatePreviousPeriod(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DuplicatePreviousPeriodDto,
  ) {
    return this.scheduleService.duplicatePreviousPeriod(
      user.organisationId,
      user.id,
      dto,
    );
  }
}
