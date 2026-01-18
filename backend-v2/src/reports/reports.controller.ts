import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('schedule')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getScheduleReport(
    @CurrentUser() user: { organisationId: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('locationId') locationId: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date();

    const data = await this.reportsService.getScheduleSummary(
      user.organisationId,
      fromDate,
      toDate,
      locationId,
    );

    if (format === 'csv') {
      const headers = [
        'id',
        'date',
        'startsAt',
        'endsAt',
        'hours',
        'employee',
        'location',
      ];
      const csvData = data.map((shift) => ({
        id: shift.id,
        date: shift.startsAt.toISOString().split('T')[0],
        startsAt: shift.startsAt.toISOString(),
        endsAt: shift.endsAt.toISOString(),
        hours: this.reportsService.getShiftDurationHours(
          shift.startsAt,
          shift.endsAt,
        ),
        employee: shift.employee
          ? `${shift.employee.firstName} ${shift.employee.lastName}`
          : '',
        location: shift.location?.name || '',
      }));

      const csv = this.reportsService.convertToCSV(csvData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=schedule-report.csv',
      );
      return res.send(csv);
    }

    return res.json(data);
  }

  @Get('leaves')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getLeavesReport(
    @CurrentUser() user: { organisationId: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date();

    const data = await this.reportsService.getLeavesSummary(
      user.organisationId,
      fromDate,
      toDate,
    );

    if (format === 'csv') {
      const headers = [
        'id',
        'startDate',
        'endDate',
        'status',
        'employee',
        'leaveType',
        'category',
      ];
      const csvData = data.map((leave) => ({
        id: leave.id,
        startDate: leave.startDate.toISOString().split('T')[0],
        endDate: leave.endDate.toISOString().split('T')[0],
        status: leave.status,
        employee: leave.employee
          ? `${leave.employee.firstName} ${leave.employee.lastName}`
          : '',
        leaveType: leave.leaveType?.name || '',
        category: leave.leaveType?.category || '',
      }));

      const csv = this.reportsService.convertToCSV(csvData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=leaves-report.csv',
      );
      return res.send(csv);
    }

    return res.json(data);
  }

  @Get('hours')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getHoursReport(
    @CurrentUser() user: { organisationId: string },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('locationId') locationId: string,
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date();

    const data = await this.reportsService.getHoursSummary(
      user.organisationId,
      fromDate,
      toDate,
      locationId,
    );

    if (format === 'csv') {
      const headers = [
        'employeeId',
        'employee',
        'location',
        'hours',
        'shiftCount',
      ];
      const csvData = data.map((row) => ({
        employeeId: row.employeeId,
        employee: row.employeeName,
        location: row.locationName,
        hours: row.hours,
        shiftCount: row.shiftCount,
      }));

      const csv = this.reportsService.convertToCSV(csvData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=hours-report.csv',
      );
      return res.send(csv);
    }

    return res.json(data);
  }
}
