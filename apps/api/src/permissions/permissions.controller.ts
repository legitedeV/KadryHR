import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../common/guards/org.guard';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgContext } from '../common/interfaces/request-with-auth.interface';
import { PermissionsService } from './permissions.service';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto';

@UseGuards(JwtAuthGuard, OrgGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  getPermissions() {
    return this.permissionsService.getRolePermissions();
  }

  @Put('memberships/:membershipId')
  async updateMembershipRole(
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipRoleDto,
    @OrgContextDecorator() orgContext: OrgContext,
  ) {
    return this.permissionsService.updateMembershipRole(
      membershipId,
      orgContext.orgId,
      dto.role,
      orgContext.membershipRole,
    );
  }
}
