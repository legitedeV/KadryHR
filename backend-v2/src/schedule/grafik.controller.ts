import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
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
import { Role, ScheduleStatus } from '@prisma/client';
import { ScheduleService } from './schedule.service';
import { SchedulePeriodActionDto } from './dto/period-action.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('grafik')
export class GrafikController {
  private readonly logger = new Logger(GrafikController.name);

  constructor(private readonly scheduleService: ScheduleService) {}

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Post('approve')
  @HttpCode(200)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SchedulePeriodActionDto,
    @Req() req: { requestId?: string },
  ) {
    const result = await this.scheduleService.approveSchedule(
      user.organisationId,
      user.id,
      dto.periodId,
    );

    this.logger.log(
      JSON.stringify({
        requestId: req.requestId,
        organisationId: user.organisationId,
        newStatus: ScheduleStatus.APPROVED,
        statusCode: 200,
      }),
    );

    return result;
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Post('publish')
  @HttpCode(200)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PublishScheduleDto,
    @Req() req: { requestId?: string },
  ) {
    const result = await this.scheduleService.publishSchedule(
      user.organisationId,
      user.id,
      dto,
    );

    this.logger.log(
      JSON.stringify({
        requestId: req.requestId,
        organisationId: user.organisationId,
        newStatus: ScheduleStatus.PUBLISHED,
        statusCode: 200,
      }),
    );

    return result;
  }

  @RequirePermissions(Permission.SCHEDULE_MANAGE)
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  @Post('unpublish')
  @HttpCode(200)
  async unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SchedulePeriodActionDto,
    @Req() req: { requestId?: string },
  ) {
    const result = await this.scheduleService.unpublishSchedule(
      user.organisationId,
      user.id,
      dto.periodId,
    );

    this.logger.log(
      JSON.stringify({
        requestId: req.requestId,
        organisationId: user.organisationId,
        newStatus: ScheduleStatus.APPROVED,
        statusCode: 200,
      }),
    );

    return result;
  }
}
