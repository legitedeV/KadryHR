import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date();

    const data = await this.reportsService.getScheduleSummary(
      user.organisationId,
      fromDate,
      toDate,
    );

    if (format === 'csv') {
      const headers = ['id', 'date', 'startMinutes', 'endMinutes', 'employee', 'location'];
      const csvData = data.map(shift => ({
        id: shift.id,
        date: shift.date.toISOString().split('T')[0],
        startMinutes: shift.startMinutes,
        endMinutes: shift.endMinutes,
        employee: shift.employee ? `${shift.employee.firstName} ${shift.employee.lastName}` : '',
        location: shift.location?.name || '',
      }));
      
      const csv = this.reportsService.convertToCSV(csvData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=schedule-report.csv');
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
      const headers = ['id', 'startDate', 'endDate', 'status', 'employee', 'leaveType', 'category'];
      const csvData = data.map(leave => ({
        id: leave.id,
        startDate: leave.startDate.toISOString().split('T')[0],
        endDate: leave.endDate.toISOString().split('T')[0],
        status: leave.status,
        employee: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '',
        leaveType: leave.leaveType?.name || '',
        category: leave.leaveType?.category || '',
      }));
      
      const csv = this.reportsService.convertToCSV(csvData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=leaves-report.csv');
      return res.send(csv);
    }

    return res.json(data);
  }
}
