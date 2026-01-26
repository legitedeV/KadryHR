import {
  Controller,
  Get,
  Query,
  UseGuards,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { GetPayrollSummaryDto } from './dto/get-payroll-summary.dto';
import { Permission } from '../auth/permissions';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @RequirePermissions(Permission.REPORT_EXPORT)
  @Get('summary')
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetPayrollSummaryDto,
  ) {
    // Employees can only view their own payroll
    let employeeId = query.employeeId;
    if (user.role === Role.EMPLOYEE) {
      const employee = await this.payrollService['prisma'].employee.findFirst({
        where: { userId: user.id, organisationId: user.organisationId },
      });
      if (!employee) {
        return null;
      }
      employeeId = employee.id;
    }

    return this.payrollService.getSummary(
      user.organisationId,
      employeeId,
      query.month,
    );
  }

  @RequirePermissions(Permission.REPORT_EXPORT)
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="payroll-summary.csv"')
  async exportCSV(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetPayrollSummaryDto,
  ) {
    const csv = await this.payrollService.exportToCSV(
      user.organisationId,
      query.employeeId,
      query.month,
    );

    return new StreamableFile(Buffer.from(csv, 'utf-8'));
  }
}
