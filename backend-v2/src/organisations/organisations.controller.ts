import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
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
    return this.organisationsService.update(user.organisationId, dto);
  }
}
