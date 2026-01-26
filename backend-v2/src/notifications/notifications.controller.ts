import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly campaignService: CampaignService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationsService.list(user.organisationId, user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.organisationId, user.id);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getPreferences(
      user.organisationId,
      user.id,
    );
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(
      user.organisationId,
      user.id,
      dto.preferences,
    );
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(
      user.organisationId,
      user.id,
    );
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(
      user.organisationId,
      user.id,
      id,
    );
  }

  @Post('test')
  sendTest(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.sendTestNotification(
      user.organisationId,
      user.id,
    );
  }

  // Campaign endpoints
  @Post('campaigns')
  createCampaign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignService.createCampaign(
      user.organisationId,
      user.id,
      user.role,
      dto,
    );
  }

  @Post('campaigns/:id/send')
  sendCampaign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.campaignService.sendCampaign(
      user.organisationId,
      user.id,
      user.role,
      id,
    );
  }

  @Get('campaigns')
  listCampaigns(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignsDto,
  ) {
    return this.campaignService.listCampaigns(
      user.organisationId,
      user.role,
      query,
    );
  }

  @Get('campaigns/:id')
  getCampaignDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.campaignService.getCampaignDetails(
      user.organisationId,
      user.role,
      id,
    );
  }
}
