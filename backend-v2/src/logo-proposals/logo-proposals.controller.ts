import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Permission } from '../auth/permissions';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { LogoProposalsService } from './logo-proposals.service';
import { CreateLogoProposalDto } from './dto/create-logo-proposal.dto';
import { UpdateLogoProposalDto } from './dto/update-logo-proposal.dto';
import { FeedbackLogoProposalDto } from './dto/feedback-logo-proposal.dto';
import { ApproveLogoProposalDto } from './dto/approve-logo-proposal.dto';
import { RejectLogoProposalDto } from './dto/reject-logo-proposal.dto';
import { QueryLogoProposalsDto } from './dto/query-logo-proposals.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('logo-proposals')
export class LogoProposalsController {
  constructor(private readonly logoProposalsService: LogoProposalsService) {}

  @RequirePermissions(Permission.BRANDING_VIEW)
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryLogoProposalsDto,
  ) {
    return this.logoProposalsService.list(user, query);
  }

  @RequirePermissions(Permission.BRANDING_VIEW)
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.logoProposalsService.findOne(user, id);
  }

  @RequirePermissions(Permission.BRANDING_MANAGE)
  @Post()
  @AuditLog({
    action: 'LOGO_PROPOSAL_CREATE',
    entityType: 'logo-proposal',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateLogoProposalDto,
  ) {
    return this.logoProposalsService.create(user, body);
  }

  @RequirePermissions(Permission.BRANDING_MANAGE)
  @Patch(':id')
  @AuditLog({
    action: 'LOGO_PROPOSAL_UPDATE',
    entityType: 'logo-proposal',
    entityIdParam: 'id',
    captureBody: true,
    fetchBefore: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateLogoProposalDto,
  ) {
    return this.logoProposalsService.update(user, id, body);
  }

  @RequirePermissions(Permission.BRANDING_MANAGE)
  @Post(':id/submit')
  @AuditLog({
    action: 'LOGO_PROPOSAL_SUBMIT',
    entityType: 'logo-proposal',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.logoProposalsService.submit(user, id);
  }

  @RequirePermissions(Permission.BRANDING_VIEW)
  @Post(':id/feedback')
  @AuditLog({
    action: 'LOGO_PROPOSAL_FEEDBACK',
    entityType: 'logo-proposal',
    entityIdParam: 'id',
    captureBody: true,
  })
  async feedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: FeedbackLogoProposalDto,
  ) {
    return this.logoProposalsService.feedback(user, id, body);
  }

  @RequirePermissions(Permission.BRANDING_MANAGE)
  @Post(':id/approve')
  @AuditLog({
    action: 'LOGO_PROPOSAL_APPROVE',
    entityType: 'logo-proposal',
    entityIdParam: 'id',
    captureBody: true,
    fetchBefore: true,
  })
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: ApproveLogoProposalDto,
  ) {
    return this.logoProposalsService.approve(
      user,
      id,
      body.applyToOrganisation ?? true,
    );
  }

  @RequirePermissions(Permission.BRANDING_MANAGE)
  @Post(':id/reject')
  @AuditLog({
    action: 'LOGO_PROPOSAL_REJECT',
    entityType: 'logo-proposal',
    entityIdParam: 'id',
    captureBody: true,
    fetchBefore: true,
  })
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: RejectLogoProposalDto,
  ) {
    return this.logoProposalsService.reject(user, id, body.reason);
  }
}
