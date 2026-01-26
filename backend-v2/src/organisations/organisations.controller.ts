import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationsService.findOne(user.organisationId);
  }

  @Patch('me')
  @Roles(Role.OWNER, Role.MANAGER)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganisationDto,
  ) {
    return this.organisationsService.update(user.organisationId, dto, user.id);
  }

  @Get('me/members')
  @Roles(Role.OWNER, Role.MANAGER, Role.ADMIN)
  async getMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationsService.getMembers(user.organisationId);
  }

  /**
   * Get schedule metadata (delivery days, promotion labels) for a date range
   */
  @Get('me/schedule-metadata')
  async getScheduleMetadata(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.organisationsService.getScheduleMetadata(
      user.organisationId,
      new Date(from),
      new Date(to),
    );
  }
}
