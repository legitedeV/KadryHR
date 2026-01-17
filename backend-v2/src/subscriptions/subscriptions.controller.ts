import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE')
  async getMySubscription(@CurrentUser() user: { organisationId: string }) {
    const subscription = await this.subscriptionsService.getByOrganisationId(
      user.organisationId,
    );

    // Return default values if no subscription exists yet
    return (
      subscription || {
        plan: 'FREE_TRIAL',
        status: 'ACTIVE',
        trialEndsAt: null,
      }
    );
  }
}
