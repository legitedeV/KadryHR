import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterSubscribeDto } from './dto/subscribe.dto';
import { NewsletterTokenDto } from './dto/token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Role } from '@prisma/client';
import { QueryNewsletterSubscribersDto } from './dto/query-subscribers.dto';

@Controller('public/newsletter')
export class PublicNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  async subscribe(@Body() body: NewsletterSubscribeDto) {
    await this.newsletterService.subscribe({
      email: body.email,
      name: body.name,
      marketingConsent: body.marketingConsent,
    });
    return { success: true };
  }

  @Post('confirm')
  async confirm(@Body() body: NewsletterTokenDto) {
    await this.newsletterService.confirm(body.token);
    return { success: true };
  }

  @Get('confirm')
  async confirmGet(@Query() query: NewsletterTokenDto) {
    await this.newsletterService.confirm(query.token);
    return { success: true };
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() body: NewsletterTokenDto) {
    await this.newsletterService.unsubscribe(body.token);
    return { success: true };
  }

  @Get('unsubscribe')
  async unsubscribeGet(@Query() query: NewsletterTokenDto) {
    await this.newsletterService.unsubscribe(query.token);
    return { success: true };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get('subscribers')
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNewsletterSubscribersDto,
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException(
        'Tylko właściciel może przeglądać subskrybentów',
      );
    }

    return this.newsletterService.list(user.organisationId, query);
  }
}
