import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { LeaveStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportFormat, ReportType, ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'MANAGER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('work-time')
  async getWorkTimeReport(
    @CurrentUser() user: { organisationId: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('locationId') locationId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const { fromDate, toDate } = this.reportsService.normalizeDateRange(
      from,
      to,
    );
    const items = await this.reportsService.getWorkTimeReport(
      user.organisationId,
      fromDate,
      toDate,
      { locationId, employeeId },
    );

    return {
      reportType: 'work-time',
      range: { from, to },
      filters: {
        locationId: locationId ?? null,
        employeeId: employeeId ?? null,
      },
      total: items.length,
      items,
    };
  }

  @Get('absences')
  async getAbsencesReport(
    @CurrentUser() user: { organisationId: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status?: LeaveStatus,
    @Query('employeeId') employeeId?: string,
  ) {
    const { fromDate, toDate } = this.reportsService.normalizeDateRange(
      from,
      to,
    );
    const items = await this.reportsService.getAbsencesReport(
      user.organisationId,
      fromDate,
      toDate,
      { status, employeeId },
    );

    return {
      reportType: 'absences',
      range: { from, to },
      filters: { status: status ?? null, employeeId: employeeId ?? null },
      total: items.length,
      items,
    };
  }

  @Get('exports/recent')
  async getRecentExports(@CurrentUser() user: { organisationId: string }) {
    return this.reportsService.getRecentExports(user.organisationId);
  }

  @Get('work-time/export')
  async exportWorkTime(
    @CurrentUser() user: { organisationId: string; id: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('locationId') locationId: string | undefined,
    @Query('employeeId') employeeId: string | undefined,
    @Query('format') format: ReportFormat = 'csv',
    @Res() res: Response,
  ) {
    const { fromDate, toDate } = this.reportsService.normalizeDateRange(
      from,
      to,
    );
    const rows = await this.reportsService.getWorkTimeReport(
      user.organisationId,
      fromDate,
      toDate,
      { locationId, employeeId },
    );
    this.reportsService.ensureExportSize(rows.length);

    const csvRows = rows.map((row) => ({
      employeeId: row.employeeId,
      employee: row.employeeName,
      location: row.locationName,
      date: row.date,
      firstClockIn: row.firstClockIn ?? '',
      lastClockOut: row.lastClockOut ?? '',
      totalHours: row.totalHours,
      entries: row.entries,
    }));
    const headers = [
      'employeeId',
      'employee',
      'location',
      'date',
      'firstClockIn',
      'lastClockOut',
      'totalHours',
      'entries',
    ];

    await this.reportsService.createExportMetadata({
      organisationId: user.organisationId,
      userId: user.id,
      reportType: 'work-time',
      format,
      rowCount: rows.length,
      filters: {
        from,
        to,
        locationId: locationId ?? null,
        employeeId: employeeId ?? null,
      },
    });

    return this.sendExportFile(res, {
      format,
      reportType: 'work-time',
      headers,
      rows: csvRows,
      fileBaseName: `work-time-${from}-${to}`,
    });
  }

  @Get('absences/export')
  async exportAbsences(
    @CurrentUser() user: { organisationId: string; id: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('status') status: LeaveStatus | undefined,
    @Query('employeeId') employeeId: string | undefined,
    @Query('format') format: ReportFormat = 'csv',
    @Res() res: Response,
  ) {
    const { fromDate, toDate } = this.reportsService.normalizeDateRange(
      from,
      to,
    );
    const rows = await this.reportsService.getAbsencesReport(
      user.organisationId,
      fromDate,
      toDate,
      { status, employeeId },
    );
    this.reportsService.ensureExportSize(rows.length);

    const csvRows = rows.map((row) => ({
      id: row.id,
      employee:
        `${row.employee.firstName ?? ''} ${row.employee.lastName ?? ''}`.trim() ||
        row.employee.email,
      startDate: row.startDate.toISOString().slice(0, 10),
      endDate: row.endDate.toISOString().slice(0, 10),
      status: row.status,
      leaveType: row.leaveType?.name ?? '',
      category: row.leaveType?.category ?? row.type,
      reason: row.reason ?? '',
    }));
    const headers = [
      'id',
      'employee',
      'startDate',
      'endDate',
      'status',
      'leaveType',
      'category',
      'reason',
    ];

    await this.reportsService.createExportMetadata({
      organisationId: user.organisationId,
      userId: user.id,
      reportType: 'absences',
      format,
      rowCount: rows.length,
      filters: {
        from,
        to,
        status: status ?? null,
        employeeId: employeeId ?? null,
      },
    });

    return this.sendExportFile(res, {
      format,
      reportType: 'absences',
      headers,
      rows: csvRows,
      fileBaseName: `absences-${from}-${to}`,
    });
  }

  private sendExportFile(
    res: Response,
    params: {
      format: ReportFormat;
      reportType: ReportType;
      headers: string[];
      rows: Array<Record<string, unknown>>;
      fileBaseName: string;
    },
  ) {
    const { format, headers, rows, fileBaseName } = params;

    if (format === 'xlsx') {
      const xlsx = this.reportsService.convertToXlsxBuffer(rows, headers);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${fileBaseName}.xlsx`,
      );
      return res.send(xlsx);
    }

    const csv = this.reportsService.convertToCSV(rows, headers);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileBaseName}.csv`,
    );
    return res.send(csv);
  }
}
