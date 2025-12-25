import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContext } from '../common/interfaces/request-with-auth.interface';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { ScheduleService } from './schedule.service';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get(':month')
  async getSchedule(
    @Param('month') month: string,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.scheduleService.getOrCreateSchedule(month, orgContext.orgId);
  }

  @Get(':month/assignments')
  async listAssignments(
    @Param('month') month: string,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    const { assignments, schedule } = await this.scheduleService.listAssignments(
      month,
      orgContext.orgId,
    );

    return { schedule, assignments };
  }

  @Post(':month/assignments')
  async createAssignment(
    @Param('month') month: string,
    @OrgContextDecorator() orgContext: OrgContext,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.scheduleService.createAssignment(month, orgContext.orgId, dto);
  }

  @Post(':month/publish')
  async publish(
    @Param('month') month: string,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.scheduleService.publish(month, orgContext.orgId);
  }

  @Post(':month/unpublish')
  async unpublish(
    @Param('month') month: string,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.scheduleService.unpublish(month, orgContext.orgId);
  }
}

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Put(':id')
  async updateAssignment(
    @Param('id') id: string,
    @OrgContextDecorator() orgContext: OrgContext,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.scheduleService.updateAssignment(id, orgContext.orgId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteAssignment(
    @Param('id') id: string,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    await this.scheduleService.deleteAssignment(id, orgContext.orgId);
  }
}
