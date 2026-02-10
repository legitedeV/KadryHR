import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import {
  CreateOrganisationLocationDto,
  UpdateOrganisationLocationDto,
} from './dto/organisation-location.dto';
import { UpdateScheduleSettingsDto } from './dto/update-schedule-settings.dto';
import { UpdateOrganisationModulesDto } from './dto/update-organisation-modules.dto';
import {
  CreateOrganisationInvitationDto,
  UpdateOrganisationMemberRoleDto,
} from './dto/organisation-member.dto';
import { OrganisationSettingsService } from './organisation-settings.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
@Controller('organisation')
export class OrganisationSettingsController {
  constructor(
    private readonly organisationSettingsService: OrganisationSettingsService,
  ) {}

  @Get('me')
  async getOrganisation(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationSettingsService.getOrganisationDetails(
      user.organisationId,
    );
  }

  @Patch('me')
  async updateOrganisation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganisationDto,
  ) {
    return this.organisationSettingsService.updateOrganisationDetails(
      user.organisationId,
      dto,
      user.id,
    );
  }

  @Get('schedule-settings')
  async getScheduleSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationSettingsService.getScheduleSettings(
      user.organisationId,
    );
  }

  @Patch('schedule-settings')
  async updateScheduleSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateScheduleSettingsDto,
  ) {
    return this.organisationSettingsService.updateScheduleSettings(
      user.organisationId,
      dto,
      user.id,
    );
  }

  @Put('schedule-settings')
  async replaceScheduleSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateScheduleSettingsDto,
  ) {
    return this.organisationSettingsService.updateScheduleSettings(
      user.organisationId,
      dto,
      user.id,
    );
  }

  @Get('modules')
  async getModules(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationSettingsService.getOrganisationModules(
      user.organisationId,
    );
  }

  @Patch('modules')
  async updateModules(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrganisationModulesDto,
  ) {
    return this.organisationSettingsService.updateOrganisationModules(
      user.organisationId,
      user.id,
      dto,
    );
  }

  @Get('locations')
  async listLocations(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationSettingsService.listLocations(user.organisationId);
  }

  @Post('locations')
  async createLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganisationLocationDto,
  ) {
    return this.organisationSettingsService.createLocation(
      user.organisationId,
      dto,
      user.id,
    );
  }

  @Patch('locations/:id')
  async updateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationLocationDto,
  ) {
    return this.organisationSettingsService.updateLocation(
      user.organisationId,
      id,
      dto,
      user.id,
    );
  }

  @Put('locations/:id')
  async replaceLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganisationLocationDto,
  ) {
    return this.organisationSettingsService.updateLocation(
      user.organisationId,
      id,
      dto,
      user.id,
    );
  }

  @Patch('locations/:id/toggle')
  async toggleLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.organisationSettingsService.toggleLocation(
      user.organisationId,
      id,
      user.id,
    );
  }

  @Get('members')
  async listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.organisationSettingsService.listMembers(user.organisationId);
  }

  @Patch('members/:memberId/role')
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOrganisationMemberRoleDto,
  ) {
    return this.organisationSettingsService.updateMemberRole(
      user.organisationId,
      user.id,
      user.role,
      memberId,
      dto,
    );
  }

  @Patch('members/:memberId/deactivate')
  async deactivateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.organisationSettingsService.deactivateMember(
      user.organisationId,
      user.id,
      user.role,
      memberId,
    );
  }

  @Post('invitations')
  async inviteMember(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganisationInvitationDto,
  ) {
    return this.organisationSettingsService.inviteMember(
      user.organisationId,
      user.id,
      user.role,
      dto,
    );
  }
}
