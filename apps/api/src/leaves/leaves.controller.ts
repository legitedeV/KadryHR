import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgContext, RequestWithAuth } from '../common/interfaces/request-with-auth.interface';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { FilterLeaveDto } from './dto/filter-leave.dto';
import { DecisionDto } from './dto/decision.dto';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  async list(@OrgContextDecorator() org: OrgContext, @Query() query: FilterLeaveDto) {
    return this.leavesService.list(org.orgId, query);
  }

  @Get(':id')
  async get(@OrgContextDecorator() org: OrgContext, @Param('id') id: string) {
    return this.leavesService.get(org.orgId, id);
  }

  @Post()
  async create(
    @OrgContextDecorator() org: OrgContext,
    @Req() request: RequestWithAuth,
    @Body() dto: CreateLeaveDto,
  ) {
    return this.leavesService.create(org.orgId, dto, request.user?.sub);
  }

  @Put(':id')
  async update(@OrgContextDecorator() org: OrgContext, @Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leavesService.update(org.orgId, id, dto);
  }

  @Delete(':id')
  async remove(@OrgContextDecorator() org: OrgContext, @Param('id') id: string) {
    await this.leavesService.remove(org.orgId, id);
    return { success: true };
  }

  @Post(':id/approve')
  async approve(
    @OrgContextDecorator() org: OrgContext,
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.leavesService.approve(org.orgId, id, dto, request.user?.sub);
  }

  @Post(':id/reject')
  async reject(
    @OrgContextDecorator() org: OrgContext,
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.leavesService.reject(org.orgId, id, dto, request.user?.sub);
  }

  @Post(':id/cancel')
  async cancel(
    @OrgContextDecorator() org: OrgContext,
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @Req() request: RequestWithAuth,
  ) {
    return this.leavesService.cancel(org.orgId, id, dto, request.user?.sub);
  }
}
