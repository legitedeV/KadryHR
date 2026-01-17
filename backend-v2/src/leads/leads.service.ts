import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadStatus, Prisma, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { AppConfig } from '../config/configuration';
import { EmailAdapter } from '../email/email.adapter';
import { EmailTemplatesService } from '../email/email-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 4;

interface LeadRequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly emailAdapter: EmailAdapter,
    private readonly emailTemplates: EmailTemplatesService,
  ) {}

  async createPublicLead(dto: CreateLeadDto, context: LeadRequestContext) {
    if (dto.website) {
      return { success: true, skipped: true };
    }

    if (!dto.consentPrivacy) {
      throw new BadRequestException(
        'Zgoda na politykę prywatności jest wymagana.',
      );
    }

    const ipHash = this.hashIp(context.ip ?? undefined);

    if (ipHash) {
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const recentCount = await this.prisma.lead.count({
        where: {
          ipHash,
          createdAt: { gte: since },
        },
      });

      if (recentCount >= RATE_LIMIT_MAX) {
        throw new TooManyRequestsException(
          'Zbyt wiele zgłoszeń z tego adresu IP. Spróbuj ponownie później.',
        );
      }
    }

    const organisationId = await this.resolveOrganisationId();

    const lead = await this.prisma.lead.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        name: dto.name.trim(),
        company: dto.company.trim(),
        headcount: dto.headcount,
        message: dto.message?.trim() || null,
        consentMarketing: dto.consentMarketing,
        consentPrivacy: dto.consentPrivacy,
        utmSource: dto.utmSource,
        utmCampaign: dto.utmCampaign,
        organisationId,
        ipHash,
        userAgent: context.userAgent ?? null,
      },
    });

    await this.prisma.leadAuditLog.create({
      data: {
        leadId: lead.id,
        organisationId,
        action: 'lead.created',
        before: null,
        after: {
          email: lead.email,
          name: lead.name,
          company: lead.company,
          headcount: lead.headcount,
          consentMarketing: lead.consentMarketing,
        },
        ipHash,
        userAgent: context.userAgent ?? null,
      },
    });

    await this.sendLeadNotifications(lead);

    return { success: true, id: lead.id };
  }

  async listLeads(user: AuthenticatedUser, query: QueryLeadsDto) {
    this.ensureAccess(user);

    const organisationId = user.organisationId;
    if (!organisationId) {
      throw new ForbiddenException('Brak przypisanej organizacji.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const includeUnassigned =
      await this.shouldIncludeUnassignedLeads(organisationId);

    const filters: Prisma.LeadWhereInput[] = [
      includeUnassigned
        ? { OR: [{ organisationId }, { organisationId: null }] }
        : { organisationId },
    ];

    if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.search) {
      const search = query.search.trim();
      if (search) {
        filters.push({
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
    }

    const where: Prisma.LeadWhereInput =
      filters.length > 1 ? { AND: filters } : filters[0];

    const [total, items] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items,
    };
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: LeadStatus) {
    this.ensureAccess(user);

    const organisationId = user.organisationId;
    if (!organisationId) {
      throw new ForbiddenException('Brak przypisanej organizacji.');
    }

    const lead = await this.prisma.lead.findFirst({
      where: { id, organisationId },
    });

    if (!lead) {
      throw new NotFoundException('Lead nie został znaleziony.');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status },
    });

    await this.prisma.leadAuditLog.create({
      data: {
        leadId: lead.id,
        organisationId,
        actorUserId: user.id,
        action: 'lead.status.updated',
        before: { status: lead.status },
        after: { status: updated.status },
        ipHash: null,
        userAgent: null,
      },
    });

    return updated;
  }

  async listAudit(
    user: AuthenticatedUser,
    id: string,
    query: { skip?: number; take?: number },
  ) {
    this.ensureAccess(user);

    const organisationId = user.organisationId;
    if (!organisationId) {
      throw new ForbiddenException('Brak przypisanej organizacji.');
    }

    const lead = await this.prisma.lead.findFirst({
      where: { id, organisationId },
    });

    if (!lead) {
      throw new NotFoundException('Lead nie został znaleziony.');
    }

    const take = query.take ?? 20;
    const skip = query.skip ?? 0;

    return this.prisma.leadAuditLog.findMany({
      where: { leadId: id, organisationId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  private ensureAccess(user: AuthenticatedUser) {
    if (!user || (user.role !== Role.OWNER && user.role !== Role.ADMIN)) {
      throw new ForbiddenException('Brak uprawnień do leadów sprzedażowych.');
    }
  }

  private hashIp(ip?: string) {
    if (!ip) return null;
    const salt = this.configService.get('leads.ipHashSalt', { infer: true });
    return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
  }

  private async sendLeadNotifications(lead: {
    id: string;
    organisationId: string | null;
    email: string;
    name: string;
    company: string;
    headcount: number | null;
    message: string | null;
  }) {
    const notificationEmail = this.configService.get(
      'leads.notificationEmail',
      { infer: true },
    );
    const autoReplyEnabled = this.configService.get('leads.autoReplyEnabled', {
      infer: true,
    });

    const adminContent = this.emailTemplates.leadAdminNotificationTemplate({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      headcount: lead.headcount,
      message: lead.message ?? undefined,
    });
    const replyContent = this.emailTemplates.leadAutoReplyTemplate({
      name: lead.name,
      company: lead.company,
      message: lead.message ?? undefined,
    });

    if (notificationEmail) {
      await this.sendLeadEmail({
        lead,
        recipient: notificationEmail,
        subject: 'Nowy lead demo KadryHR',
        text: adminContent.text,
        html: adminContent.html,
        kind: 'admin-notification',
      });
    } else {
      this.logger.warn('Lead notification email not configured.');
    }

    if (autoReplyEnabled) {
      await this.sendLeadEmail({
        lead,
        recipient: lead.email,
        subject: 'KadryHR – potwierdzenie zgłoszenia demo',
        text: replyContent.text,
        html: replyContent.html,
        kind: 'auto-reply',
      });
    }
  }

  private async sendLeadEmail(params: {
    lead: {
      id: string;
      organisationId: string | null;
      email: string;
    };
    recipient: string;
    subject: string;
    text: string;
    html: string;
    kind: 'admin-notification' | 'auto-reply';
  }) {
    const queued = await this.queueService.addNewsletterEmailJob({
      to: params.recipient,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    if (queued) {
      await this.prisma.leadAuditLog.create({
        data: {
          leadId: params.lead.id,
          organisationId: params.lead.organisationId,
          action: 'lead.notification.queued',
          before: null,
          after: {
            kind: params.kind,
            recipient: params.recipient,
          },
          ipHash: null,
          userAgent: null,
        },
      });
      return;
    }

    this.logger.warn(
      `Lead email queue unavailable, sending synchronously (${params.kind}).`,
    );

    const result = await this.emailAdapter.sendEmail({
      to: params.recipient,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    const status = result.success
      ? 'sent'
      : result.skipped
        ? 'skipped'
        : 'failed';

    await this.prisma.leadAuditLog.create({
      data: {
        leadId: params.lead.id,
        organisationId: params.lead.organisationId,
        action: `lead.notification.${status}`,
        before: null,
        after: {
          kind: params.kind,
          recipient: params.recipient,
          error: result.error ?? null,
        },
        ipHash: null,
        userAgent: null,
      },
    });
  }

  private async resolveOrganisationId(): Promise<string | null> {
    const configured = this.configService.get('leads.defaultOrganisationId', {
      infer: true,
    });
    if (configured) {
      return configured;
    }

    const organisations = await this.prisma.organisation.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (organisations.length === 1) {
      this.logger.warn(
        'LEADS_DEFAULT_ORGANISATION_ID not set. Falling back to the only organisation found.',
      );
      return organisations[0].id;
    }

    if (organisations.length > 1) {
      this.logger.warn(
        'LEADS_DEFAULT_ORGANISATION_ID not set and multiple organisations exist. Lead will be stored without organisation.',
      );
    }

    return null;
  }

  private async shouldIncludeUnassignedLeads(
    organisationId: string,
  ): Promise<boolean> {
    const configured = this.configService.get('leads.defaultOrganisationId', {
      infer: true,
    });

    if (configured) {
      return configured === organisationId;
    }

    const organisations = await this.prisma.organisation.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    return organisations.length === 1 && organisations[0].id === organisationId;
  }
}
