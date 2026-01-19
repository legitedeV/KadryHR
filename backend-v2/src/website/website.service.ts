import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWebsitePageDto } from './dto/create-website-page.dto';
import { UpdateWebsitePageDto } from './dto/update-website-page.dto';
import { CreateWebsiteSectionDto } from './dto/create-website-section.dto';
import { UpdateWebsiteSectionDto } from './dto/update-website-section.dto';
import { CreateWebsiteBlockDto } from './dto/create-website-block.dto';
import { UpdateWebsiteBlockDto } from './dto/update-website-block.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';

const sectionInclude = {
  blocks: {
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPages() {
    return this.prisma.websitePage.findMany({
      orderBy: { slug: 'asc' },
      select: {
        id: true,
        slug: true,
        seoTitle: true,
        seoDescription: true,
        seoImageUrl: true,
        isPublished: true,
        version: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { sections: true } },
      },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.websitePage.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: sectionInclude,
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Website page not found');
    }

    return page;
  }

  async getPublishedPage(slug: string) {
    const page = await this.prisma.websitePage.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: sectionInclude,
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Website page not found');
    }

    return page;
  }

  async createPage(
    organisationId: string,
    actorUserId: string,
    dto: CreateWebsitePageDto,
  ) {
    const page = await this.prisma.websitePage.create({
      data: {
        slug: dto.slug,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
        seoImageUrl: dto.seoImageUrl ?? null,
        isPublished: dto.isPublished ?? false,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_PAGE_CREATE',
      entityType: 'WebsitePage',
      entityId: page.id,
      after: page,
    });

    return page;
  }

  async updatePage(
    organisationId: string,
    actorUserId: string,
    slug: string,
    dto: UpdateWebsitePageDto,
  ) {
    const existing = await this.prisma.websitePage.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new NotFoundException('Website page not found');
    }

    const page = await this.prisma.websitePage.update({
      where: { id: existing.id },
      data: {
        slug: dto.slug ?? undefined,
        seoTitle: dto.seoTitle ?? undefined,
        seoDescription: dto.seoDescription ?? undefined,
        seoImageUrl: dto.seoImageUrl ?? undefined,
        isPublished: dto.isPublished ?? undefined,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_PAGE_UPDATE',
      entityType: 'WebsitePage',
      entityId: page.id,
      before: existing,
      after: page,
    });

    return page;
  }

  async createSection(
    organisationId: string,
    actorUserId: string,
    dto: CreateWebsiteSectionDto,
  ) {
    const page = await this.prisma.websitePage.findUnique({
      where: { id: dto.pageId },
    });

    if (!page) {
      throw new NotFoundException('Website page not found');
    }

    const section = await this.prisma.websiteSection.create({
      data: {
        pageId: dto.pageId,
        key: dto.key,
        title: dto.title ?? null,
        subtitle: dto.subtitle ?? null,
        order: dto.order ?? 0,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_SECTION_CREATE',
      entityType: 'WebsiteSection',
      entityId: section.id,
      after: section,
    });

    return section;
  }

  async updateSection(
    organisationId: string,
    actorUserId: string,
    sectionId: string,
    dto: UpdateWebsiteSectionDto,
  ) {
    const existing = await this.prisma.websiteSection.findUnique({
      where: { id: sectionId },
    });

    if (!existing) {
      throw new NotFoundException('Website section not found');
    }

    const section = await this.prisma.websiteSection.update({
      where: { id: sectionId },
      data: {
        key: dto.key ?? undefined,
        title: dto.title ?? undefined,
        subtitle: dto.subtitle ?? undefined,
        order: dto.order ?? undefined,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_SECTION_UPDATE',
      entityType: 'WebsiteSection',
      entityId: section.id,
      before: existing,
      after: section,
    });

    return section;
  }

  async deleteSection(
    organisationId: string,
    actorUserId: string,
    sectionId: string,
  ) {
    const existing = await this.prisma.websiteSection.findUnique({
      where: { id: sectionId },
    });

    if (!existing) {
      throw new NotFoundException('Website section not found');
    }

    await this.prisma.websiteSection.delete({ where: { id: sectionId } });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_SECTION_DELETE',
      entityType: 'WebsiteSection',
      entityId: sectionId,
      before: existing,
    });

    return { success: true };
  }

  async createBlock(
    organisationId: string,
    actorUserId: string,
    dto: CreateWebsiteBlockDto,
  ) {
    const section = await this.prisma.websiteSection.findUnique({
      where: { id: dto.sectionId },
    });

    if (!section) {
      throw new NotFoundException('Website section not found');
    }

    const block = await this.prisma.websiteBlock.create({
      data: {
        sectionId: dto.sectionId,
        type: dto.type,
        title: dto.title ?? null,
        body: dto.body ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        extra: dto.extra ? (dto.extra as Prisma.InputJsonValue) : Prisma.DbNull,
        order: dto.order ?? 0,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_BLOCK_CREATE',
      entityType: 'WebsiteBlock',
      entityId: block.id,
      after: block,
    });

    return block;
  }

  async updateBlock(
    organisationId: string,
    actorUserId: string,
    blockId: string,
    dto: UpdateWebsiteBlockDto,
  ) {
    const existing = await this.prisma.websiteBlock.findUnique({
      where: { id: blockId },
    });

    if (!existing) {
      throw new NotFoundException('Website block not found');
    }

    const block = await this.prisma.websiteBlock.update({
      where: { id: blockId },
      data: {
        type: dto.type ?? undefined,
        title: dto.title ?? undefined,
        body: dto.body ?? undefined,
        mediaUrl: dto.mediaUrl ?? undefined,
        extra: dto.extra ? (dto.extra as Prisma.InputJsonValue) : undefined,
        order: dto.order ?? undefined,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_BLOCK_UPDATE',
      entityType: 'WebsiteBlock',
      entityId: block.id,
      before: existing,
      after: block,
    });

    return block;
  }

  async deleteBlock(
    organisationId: string,
    actorUserId: string,
    blockId: string,
  ) {
    const existing = await this.prisma.websiteBlock.findUnique({
      where: { id: blockId },
    });

    if (!existing) {
      throw new NotFoundException('Website block not found');
    }

    await this.prisma.websiteBlock.delete({ where: { id: blockId } });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_BLOCK_DELETE',
      entityType: 'WebsiteBlock',
      entityId: blockId,
      before: existing,
    });

    return { success: true };
  }

  async getSettings() {
    const settings = await this.prisma.websiteSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (settings) {
      return settings;
    }

    return this.prisma.websiteSettings.create({ data: {} });
  }

  async updateSettings(
    organisationId: string,
    actorUserId: string,
    dto: UpdateWebsiteSettingsDto,
  ) {
    const existing = await this.prisma.websiteSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      const created = await this.prisma.websiteSettings.create({
        data: {
          contactEmails: dto.contactEmails ?? [],
          socialLinks: dto.socialLinks
            ? (dto.socialLinks as Prisma.InputJsonValue)
            : Prisma.DbNull,
          footerLinks: dto.footerLinks
            ? (dto.footerLinks as Prisma.InputJsonValue)
            : Prisma.DbNull,
          cookieBannerText: dto.cookieBannerText ?? null,
          cookiePolicyUrl: dto.cookiePolicyUrl ?? null,
          privacyPolicyUrl: dto.privacyPolicyUrl ?? null,
          termsOfServiceUrl: dto.termsOfServiceUrl ?? null,
        },
      });

      await this.auditService.record({
        organisationId,
        actorUserId,
        action: 'WEBSITE_SETTINGS_CREATE',
        entityType: 'WebsiteSettings',
        entityId: created.id,
        after: created,
      });

      return created;
    }

    const updated = await this.prisma.websiteSettings.update({
      where: { id: existing.id },
      data: {
        contactEmails: dto.contactEmails ?? undefined,
        socialLinks: dto.socialLinks
          ? (dto.socialLinks as Prisma.InputJsonValue)
          : undefined,
        footerLinks: dto.footerLinks
          ? (dto.footerLinks as Prisma.InputJsonValue)
          : undefined,
        cookieBannerText: dto.cookieBannerText ?? undefined,
        cookiePolicyUrl: dto.cookiePolicyUrl ?? undefined,
        privacyPolicyUrl: dto.privacyPolicyUrl ?? undefined,
        termsOfServiceUrl: dto.termsOfServiceUrl ?? undefined,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'WEBSITE_SETTINGS_UPDATE',
      entityType: 'WebsiteSettings',
      entityId: updated.id,
      before: existing,
      after: updated,
    });

    return updated;
  }
}
