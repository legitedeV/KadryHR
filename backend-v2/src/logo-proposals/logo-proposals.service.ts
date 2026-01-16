import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LogoProposalStatus,
  NotificationChannel,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplatesService } from '../email/email-templates.service';
import { CreateLogoProposalDto } from './dto/create-logo-proposal.dto';
import { UpdateLogoProposalDto } from './dto/update-logo-proposal.dto';
import { FeedbackLogoProposalDto } from './dto/feedback-logo-proposal.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { getPermissionsForRole, Permission } from '../auth/permissions';

@Injectable()
export class LogoProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly configService: ConfigService,
  ) {}

  private canManage(user: AuthenticatedUser) {
    const permissions = user.permissions?.length
      ? user.permissions
      : getPermissionsForRole(user.role);
    return permissions.includes(Permission.BRANDING_MANAGE);
  }

  private baseFrontendUrl() {
    const baseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'https://kadryhr.pl';
    return baseUrl.replace(/\/$/, '');
  }

  private proposalUrl(proposalId: string) {
    return `${this.baseFrontendUrl()}/panel/logo-propozycje?proposal=${proposalId}`;
  }

  async list(user: AuthenticatedUser, query: { status?: LogoProposalStatus; skip?: number; take?: number }) {
    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const canManage = this.canManage(user);
    const where: Prisma.LogoProposalWhereInput = {
      organisationId: user.organisationId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (!canManage) {
      where.status = { in: [LogoProposalStatus.SUBMITTED, LogoProposalStatus.APPROVED] };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.logoProposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          feedbacks: true,
        },
      }),
      this.prisma.logoProposal.count({ where }),
    ]);

    return { data, total, take, skip };
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        feedbacks: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (!this.canManage(user) && ![LogoProposalStatus.SUBMITTED, LogoProposalStatus.APPROVED].includes(proposal.status)) {
      throw new ForbiddenException('Not allowed to access this proposal');
    }

    return proposal;
  }

  async create(user: AuthenticatedUser, dto: CreateLogoProposalDto) {
    return this.prisma.logoProposal.create({
      data: {
        organisationId: user.organisationId,
        createdById: user.id,
        title: dto.title,
        description: dto.description,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        accentColor: dto.accentColor,
        typography: dto.typography,
        symbol: dto.symbol,
        logoSvg: dto.logoSvg,
        logoConfig: dto.logoConfig ?? Prisma.JsonNull,
      },
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateLogoProposalDto) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (proposal.status !== LogoProposalStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be updated');
    }

    return this.prisma.logoProposal.update({
      where: { id },
      data: {
        title: dto.title ?? proposal.title,
        description: dto.description ?? proposal.description,
        primaryColor: dto.primaryColor ?? proposal.primaryColor,
        secondaryColor: dto.secondaryColor ?? proposal.secondaryColor,
        accentColor: dto.accentColor ?? proposal.accentColor,
        typography: dto.typography ?? proposal.typography,
        symbol: dto.symbol ?? proposal.symbol,
        logoSvg: dto.logoSvg ?? proposal.logoSvg,
        logoConfig: dto.logoConfig ?? proposal.logoConfig,
      },
    });
  }

  async submit(user: AuthenticatedUser, id: string) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (proposal.status !== LogoProposalStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be submitted');
    }

    const updated = await this.prisma.logoProposal.update({
      where: { id },
      data: {
        status: LogoProposalStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedById: user.id,
      },
    });

    await this.notifyReviewers(updated);

    return updated;
  }

  async feedback(user: AuthenticatedUser, id: string, dto: FeedbackLogoProposalDto) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (![LogoProposalStatus.SUBMITTED, LogoProposalStatus.APPROVED].includes(proposal.status)) {
      throw new BadRequestException('Feedback is available for submitted or approved proposals');
    }

    return this.prisma.logoProposalFeedback.upsert({
      where: { proposalId_userId: { proposalId: id, userId: user.id } },
      update: { vote: dto.vote, comment: dto.comment },
      create: {
        proposalId: id,
        organisationId: user.organisationId,
        userId: user.id,
        vote: dto.vote,
        comment: dto.comment,
      },
    });
  }

  async approve(user: AuthenticatedUser, id: string, applyToOrganisation = true) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (proposal.status !== LogoProposalStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted proposals can be approved');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.logoProposal.update({
        where: { id },
        data: {
          status: LogoProposalStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: user.id,
        },
      }),
      ...(applyToOrganisation
        ? [
            this.prisma.organisation.update({
              where: { id: user.organisationId },
              data: {
                logoUrl: this.toDataUrl(proposal.logoSvg),
              },
            }),
          ]
        : []),
    ]);

    await this.notifyApproved(updated, applyToOrganisation);

    return updated;
  }

  async reject(user: AuthenticatedUser, id: string, reason?: string) {
    const proposal = await this.prisma.logoProposal.findFirst({
      where: { id, organisationId: user.organisationId },
    });

    if (!proposal) {
      throw new NotFoundException('Logo proposal not found');
    }

    if (proposal.status !== LogoProposalStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted proposals can be rejected');
    }

    return this.prisma.logoProposal.update({
      where: { id },
      data: {
        status: LogoProposalStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: user.id,
        rejectionReason: reason ?? null,
      },
    });
  }

  private toDataUrl(svg: string) {
    const encoded = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${encoded}`;
  }

  private async notifyReviewers(proposal: { id: string; organisationId: string; title: string }) {
    const users = await this.prisma.user.findMany({
      where: {
        organisationId: proposal.organisationId,
        role: Role.EMPLOYEE,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: proposal.organisationId },
      select: { name: true },
    });

    await Promise.all(
      users.map((recipient) => {
        const recipientName =
          `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() ||
          recipient.email;
        const template = this.emailTemplates.logoProposalReviewTemplate({
          organisationName: organisation?.name ?? 'Twoja organizacja',
          proposalTitle: proposal.title,
          reviewUrl: this.proposalUrl(proposal.id),
          recipientName,
        });

        return this.notificationsService.createNotification({
          organisationId: proposal.organisationId,
          userId: recipient.id,
          type: NotificationType.LOGO_PROPOSAL_REVIEW,
          title: 'Nowa propozycja logo do oceny',
          body: `Zespół potrzebuje Twojej opinii o propozycji "${proposal.title}".`,
          data: { proposalId: proposal.id },
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          emailSubject: template.subject,
          emailHtml: template.html,
        });
      }),
    );
  }

  private async notifyApproved(proposal: { id: string; organisationId: string; title: string }, applied: boolean) {
    const users = await this.prisma.user.findMany({
      where: { organisationId: proposal.organisationId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: proposal.organisationId },
      select: { name: true },
    });

    await Promise.all(
      users.map((recipient) => {
        const recipientName =
          `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() ||
          recipient.email;
        const template = this.emailTemplates.logoProposalApprovedTemplate({
          organisationName: organisation?.name ?? 'Twoja organizacja',
          proposalTitle: proposal.title,
          dashboardUrl: this.proposalUrl(proposal.id),
          recipientName,
        });

        return this.notificationsService.createNotification({
          organisationId: proposal.organisationId,
          userId: recipient.id,
          type: NotificationType.LOGO_PROPOSAL_APPROVED,
          title: applied
            ? 'Logo organizacji zostało zatwierdzone'
            : 'Propozycja logo została zatwierdzona',
          body: `Propozycja "${proposal.title}" została zatwierdzona${
            applied ? ' i ustawiona jako logo organizacji.' : '.'
          }`,
          data: { proposalId: proposal.id },
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          emailSubject: template.subject,
          emailHtml: template.html,
        });
      }),
    );
  }
}
