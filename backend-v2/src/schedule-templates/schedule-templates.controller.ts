import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ScheduleTemplatesService } from './schedule-templates.service';
import { CreateScheduleTemplateFromWeekDto } from './dto/create-schedule-template-from-week.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('schedule-templates')
export class ScheduleTemplatesController {
  constructor(
    private readonly scheduleTemplatesService: ScheduleTemplatesService,
  ) {}

  @RequirePermissions(Permission.RCP_EDIT)
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.scheduleTemplatesService.listTemplates(user.organisationId);
  }

  @RequirePermissions(Permission.RCP_EDIT)
  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.scheduleTemplatesService.getTemplate(user.organisationId, id);
  }

  @RequirePermissions(Permission.RCP_EDIT)
  @Post('from-week')
  @AuditLog({
    action: 'SCHEDULE_TEMPLATE_CREATE',
    entityType: 'schedule_template',
    captureBody: true,
  })
  async createFromWeek(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleTemplateFromWeekDto,
  ) {
    return this.scheduleTemplatesService.createFromWeek(
      user.organisationId,
      dto,
      user.id,
    );
  }
}
