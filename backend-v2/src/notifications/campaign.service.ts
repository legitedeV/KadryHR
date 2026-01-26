import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  NotificationCampaignStatus,
  NotificationRecipientStatus,
  NotificationChannel,
  NotificationType,
  Role,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { AuditService } from '../audit/audit.service';

export interface AudienceFilter {
  all?: boolean;
  roles?: Role[];
  locationIds?: string[];
  employeeIds?: string[];
}

export interface CreateCampaignDto {
  title: string;
  body?: string;
  type?: NotificationType;
  channels: NotificationChannel[];
  audienceFilter: AudienceFilter;
}

export interface ListCampaignsDto {
  skip?: number;
  take?: number;
  status?: NotificationCampaignStatus;
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async createCampaign(
    organisationId: string,
    userId: string,
    userRole: Role,
    dto: CreateCampaignDto,
  ) {
    // Only MANAGER and OWNER can create campaigns
    if (
      userRole !== Role.MANAGER &&
      userRole !== Role.OWNER &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Only managers and owners can create campaigns',
      );
    }

    // Validate channels
    if (!dto.channels || dto.channels.length === 0) {
      throw new BadRequestException('At least one channel must be selected');
    }

    // Validate audience filter
    if (!dto.audienceFilter || Object.keys(dto.audienceFilter).length === 0) {
      throw new BadRequestException('Audience filter is required');
    }

    const campaign = await this.prisma.notificationCampaign.create({
      data: {
        organisationId,
        createdByUserId: userId,
        title: dto.title,
        body: dto.body ?? null,
        type: dto.type ?? NotificationType.CUSTOM,
        channels: dto.channels,
        audienceFilter: dto.audienceFilter as Prisma.InputJsonValue,
        status: NotificationCampaignStatus.DRAFT,
      },
    });

    await this.auditService.log({
      organisationId,
      actorUserId: userId,
      action: 'campaign.created',
      entityType: 'NotificationCampaign',
      entityId: campaign.id,
      after: campaign,
    });

    return campaign;
  }

  async sendCampaign(
    organisationId: string,
    userId: string,
    userRole: Role,
    campaignId: string,
  ) {
    // Only MANAGER and OWNER can send campaigns
    if (
      userRole !== Role.MANAGER &&
      userRole !== Role.OWNER &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Only managers and owners can send campaigns',
      );
    }

    const campaign = await this.prisma.notificationCampaign.findFirst({
      where: {
        id: campaignId,
        organisationId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== NotificationCampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be sent');
    }

    // Update status to SENDING
    await this.prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { status: NotificationCampaignStatus.SENDING },
    });

    try {
      // Resolve audience
      const audienceFilter = campaign.audienceFilter as AudienceFilter | null;
      const recipientUserIds = await this.resolveAudience(
        organisationId,
        audienceFilter ?? { all: true },
      );

      if (recipientUserIds.length === 0) {
        const filterSummary = audienceFilter?.all
          ? 'all users'
          : [
              audienceFilter?.roles?.length
                ? `roles: ${audienceFilter.roles.join(', ')}`
                : '',
              audienceFilter?.locationIds?.length
                ? `locations: ${audienceFilter.locationIds.length} selected`
                : '',
              audienceFilter?.employeeIds?.length
                ? `employees: ${audienceFilter.employeeIds.length} selected`
                : '',
            ]
              .filter(Boolean)
              .join(', ');
        throw new BadRequestException(
          `No recipients found for this audience (${filterSummary || 'no filters specified'})`,
        );
      }

      // Create recipient records
      const recipientData = recipientUserIds.map((recipientUserId) => ({
        campaignId: campaign.id,
        userId: recipientUserId,
        status: NotificationRecipientStatus.PENDING,
      }));

      await this.prisma.notificationRecipient.createMany({
        data: recipientData,
        skipDuplicates: true,
      });

      // Fan out notifications to each recipient
      for (const recipientUserId of recipientUserIds) {
        await this.notificationsService.createNotification({
          organisationId,
          userId: recipientUserId,
          type: campaign.type,
          title: campaign.title,
          body: campaign.body ?? undefined,
          data: { campaignId: campaign.id },
          channels: campaign.channels,
          emailSubject: campaign.title,
        });

        // Update recipient status
        await this.prisma.notificationRecipient.updateMany({
          where: {
            campaignId: campaign.id,
            userId: recipientUserId,
          },
          data: {
            status: NotificationRecipientStatus.DELIVERED_IN_APP,
            deliveredInAppAt: new Date(),
          },
        });
      }

      // Update campaign status to SENT
      await this.prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: {
          status: NotificationCampaignStatus.SENT,
          sentAt: new Date(),
        },
      });

      await this.auditService.log({
        organisationId,
        actorUserId: userId,
        action: 'campaign.sent',
        entityType: 'NotificationCampaign',
        entityId: campaign.id,
        after: { recipientCount: recipientUserIds.length },
      });

      return {
        success: true,
        recipientCount: recipientUserIds.length,
      };
    } catch (error) {
      // Update status to FAILED
      await this.prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: { status: NotificationCampaignStatus.FAILED },
      });

      throw error;
    }
  }

  async listCampaigns(
    organisationId: string,
    userRole: Role,
    dto: ListCampaignsDto,
  ) {
    // Only MANAGER and OWNER can list campaigns
    if (
      userRole !== Role.MANAGER &&
      userRole !== Role.OWNER &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Only managers and owners can view campaigns',
      );
    }

    const take = Math.min(dto.take ?? 20, 100);
    const skip = dto.skip ?? 0;

    const where: Prisma.NotificationCampaignWhereInput = {
      organisationId,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    const [campaigns, total] = await this.prisma.$transaction([
      this.prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              recipients: true,
            },
          },
        },
      }),
      this.prisma.notificationCampaign.count({ where }),
    ]);

    return {
      data: campaigns,
      total,
      skip,
      take,
    };
  }

  async getCampaignDetails(
    organisationId: string,
    userRole: Role,
    campaignId: string,
  ) {
    // Only MANAGER and OWNER can view campaign details
    if (
      userRole !== Role.MANAGER &&
      userRole !== Role.OWNER &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Only managers and owners can view campaign details',
      );
    }

    const campaign = await this.prisma.notificationCampaign.findFirst({
      where: {
        id: campaignId,
        organisationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Calculate delivery stats
    const stats = {
      total: campaign.recipients.length,
      deliveredInApp: campaign.recipients.filter(
        (r) =>
          r.status === NotificationRecipientStatus.DELIVERED_IN_APP ||
          r.status === NotificationRecipientStatus.EMAIL_SENT,
      ).length,
      emailSent: campaign.recipients.filter(
        (r) => r.status === NotificationRecipientStatus.EMAIL_SENT,
      ).length,
      emailFailed: campaign.recipients.filter(
        (r) => r.status === NotificationRecipientStatus.EMAIL_FAILED,
      ).length,
      skipped: campaign.recipients.filter(
        (r) => r.status === NotificationRecipientStatus.SKIPPED,
      ).length,
    };

    return {
      ...campaign,
      stats,
    };
  }

  private async resolveAudience(
    organisationId: string,
    filter: AudienceFilter,
  ): Promise<string[]> {
    const where: Prisma.UserWhereInput = {
      organisationId,
    };

    // If all is true, return all users in the org
    if (filter.all) {
      const users = await this.prisma.user.findMany({
        where,
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    // Filter by roles
    if (filter.roles && filter.roles.length > 0) {
      where.role = { in: filter.roles };
    }

    // Filter by location - users must have an employee profile assigned to the location
    if (filter.locationIds && filter.locationIds.length > 0) {
      where.employee = {
        locations: {
          some: {
            locationId: { in: filter.locationIds },
          },
        },
      };
    }

    // Filter by specific employee IDs
    if (filter.employeeIds && filter.employeeIds.length > 0) {
      where.employee = {
        ...(where.employee as Prisma.EmployeeWhereInput),
        id: { in: filter.employeeIds },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    return users.map((u) => u.id);
  }
}
