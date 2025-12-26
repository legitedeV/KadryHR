import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgContext, RequestWithAuth } from '../common/interfaces/request-with-auth.interface';
import { TimeTrackingService } from './time-tracking.service';
import { RecordEventDto } from './dto/record-event.dto';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { GenerateQrDto } from './dto/generate-qr.dto';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly service: TimeTrackingService) {}

  @Get('status')
  async status(@OrgContextDecorator() org: OrgContext, @Query('employeeId') employeeId: string) {
    return this.service.getStatus(org.orgId, employeeId);
  }

  @Get('recent')
  async recent(@OrgContextDecorator() org: OrgContext, @Query('employeeId') employeeId?: string) {
    return this.service.getRecentEvents(org.orgId, employeeId);
  }

  @Get('report')
  async report(@OrgContextDecorator() org: OrgContext, @Query() query: ReportQueryDto) {
    return this.service.buildReport(org.orgId, query);
  }

  @Post('events')
  async event(
    @OrgContextDecorator() org: OrgContext,
    @Req() request: RequestWithAuth,
    @Body() dto: RecordEventDto,
  ) {
    return this.service.recordEvent(org.orgId, dto, request.user?.sub);
  }

  @Post('manual')
  async manual(
    @OrgContextDecorator() org: OrgContext,
    @Req() request: RequestWithAuth,
    @Body() dto: ManualEntryDto,
  ) {
    return this.service.createManualEntry(org.orgId, dto, request.user?.sub);
  }

  @Post('qr')
  async qr(
    @OrgContextDecorator() org: OrgContext,
    @Req() request: RequestWithAuth,
    @Body() dto: GenerateQrDto,
  ) {
    return this.service.generateQr(org.orgId, dto, request.user?.sub);
  }
}
