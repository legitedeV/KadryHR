import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContext } from '../common/interfaces/request-with-auth.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard overview data for the active organization' })
  async getOverview(@OrgContextDecorator() orgContext: OrgContext) {
    return this.dashboardService.getOverview(orgContext.orgId);
  }
}
