import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { WebsiteService } from './website.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateWebsitePageDto } from './dto/create-website-page.dto';
import { UpdateWebsitePageDto } from './dto/update-website-page.dto';
import { CreateWebsiteSectionDto } from './dto/create-website-section.dto';
import { UpdateWebsiteSectionDto } from './dto/update-website-section.dto';
import { CreateWebsiteBlockDto } from './dto/create-website-block.dto';
import { UpdateWebsiteBlockDto } from './dto/update-website-block.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';

@Controller('website')
export class WebsitePublicController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('pages/:slug')
  getPublishedPage(@Param('slug') slug: string) {
    return this.websiteService.getPublishedPage(slug);
  }

  @Get('settings')
  getSettings() {
    return this.websiteService.getSettings();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Controller('website/admin')
export class WebsiteAdminController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('pages')
  listPages() {
    return this.websiteService.listPages();
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.websiteService.getPageBySlug(slug);
  }

  @Post('pages')
  createPage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebsitePageDto,
  ) {
    return this.websiteService.createPage(user.organisationId, user.id, dto);
  }

  @Patch('pages/:slug')
  updatePage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: UpdateWebsitePageDto,
  ) {
    return this.websiteService.updatePage(
      user.organisationId,
      user.id,
      slug,
      dto,
    );
  }

  @Patch('pages/:slug/publish')
  publishPage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: UpdateWebsitePageDto,
  ) {
    return this.websiteService.updatePage(
      user.organisationId,
      user.id,
      slug,
      dto,
    );
  }

  @Post('sections')
  createSection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebsiteSectionDto,
  ) {
    return this.websiteService.createSection(user.organisationId, user.id, dto);
  }

  @Patch('sections/:id')
  updateSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteSectionDto,
  ) {
    return this.websiteService.updateSection(
      user.organisationId,
      user.id,
      id,
      dto,
    );
  }

  @Delete('sections/:id')
  deleteSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.websiteService.deleteSection(user.organisationId, user.id, id);
  }

  @Post('blocks')
  createBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebsiteBlockDto,
  ) {
    return this.websiteService.createBlock(user.organisationId, user.id, dto);
  }

  @Patch('blocks/:id')
  updateBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteBlockDto,
  ) {
    return this.websiteService.updateBlock(
      user.organisationId,
      user.id,
      id,
      dto,
    );
  }

  @Delete('blocks/:id')
  deleteBlock(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.websiteService.deleteBlock(user.organisationId, user.id, id);
  }

  @Get('settings')
  getAdminSettings() {
    return this.websiteService.getSettings();
  }

  @Put('settings')
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWebsiteSettingsDto,
  ) {
    return this.websiteService.updateSettings(
      user.organisationId,
      user.id,
      dto,
    );
  }
}
