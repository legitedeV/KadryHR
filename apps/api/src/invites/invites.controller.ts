import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgContext, RequestWithAuth } from '../common/interfaces/request-with-auth.interface';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  async list(@OrgContextDecorator() orgContext: OrgContext) {
    return this.invitesService.list(orgContext.orgId);
  }

  @Post()
  async create(
    @Body() dto: CreateInviteDto,
    @Req() request: RequestWithAuth,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.invitesService.create(orgContext.orgId, dto, request.user?.sub);
  }

  @Post(':id/resend')
  async resend(@Param('id') id: string, @OrgContextDecorator() orgContext: OrgContext) {
    return this.invitesService.resend(orgContext.orgId, id);
  }

  @Post(':id/revoke')
  async revoke(@Param('id') id: string, @OrgContextDecorator() orgContext: OrgContext) {
    return this.invitesService.revoke(orgContext.orgId, id);
  }
}
