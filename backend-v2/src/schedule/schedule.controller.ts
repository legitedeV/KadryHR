import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
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
import { ScheduleCostService } from './schedule-cost.service';
import { QueryScheduleSummaryDto } from './dto/query-schedule-summary.dto';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('schedule')
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly scheduleCostService: ScheduleCostService,
  ) {}

  @RequirePermissions(Permission.SCHEDULE_VIEW)
  @Get()
  async getSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryScheduleDto,
    @Req() req: { requestId?: string; originalUrl?: string },
  ) {
    this.logger.log(
      JSON.stringify({
        requestId: req.requestId,
        organisationId: user.organisationId,
        route: req.originalUrl ?? '/schedule',
      }),
    );
    return this.scheduleService.getSchedule(user.organisationId, query);
  }

  @RequirePermissions(Permission.SCHEDULE_VIEW)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Get('summary')
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryScheduleSummaryDto,
  ) {
    return this.scheduleCostService.calculateScheduleSummary({
      organisationId: user.organisationId,
      from: query.from,
      to: query.to,
      locationIds: query.locationIds,
      positionIds: query.positionIds,
    });
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
