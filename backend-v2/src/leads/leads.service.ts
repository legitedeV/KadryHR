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
  ) {}

  async createPublicLead(dto: CreateLeadDto, context: LeadRequestContext) {
    if (dto.website) {
      return { success: true, skipped: true };
    }

    if (!dto.consentPrivacy) {
      throw new BadRequestException('Zgoda na politykę prywatności jest wymagana.');
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

    const organisationId = this.configService.get(
      'leads.defaultOrganisationId',
      {
        infer: true,
      },
    );

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
        organisationId: organisationId || null,
        ipHash,
        userAgent: context.userAgent ?? null,
      },
    });

    await this.prisma.leadAuditLog.create({
      data: {
        leadId: lead.id,
        organisationId: organisationId || null,
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

    const where: Prisma.LeadWhereInput = {
      organisationId,
      status: query.status,
    };

    if (query.search) {
      const search = query.search.trim();
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

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

  async updateStatus(
    user: AuthenticatedUser,
    id: string,
    status: LeadStatus,
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

    const adminContent = this.buildAdminNotification(lead);
    const replyContent = this.buildAutoReply(lead);

    if (notificationEmail) {
      const queued = await this.queueService.addNewsletterEmailJob({
        to: notificationEmail,
        subject: 'Nowy lead demo KadryHR',
        text: adminContent.text,
        html: adminContent.html,
      });

      if (!queued) {
        this.logger.warn('Lead notification email queued synchronously.');
      }
    }

    if (autoReplyEnabled) {
      const queued = await this.queueService.addNewsletterEmailJob({
        to: lead.email,
        subject: 'KadryHR – potwierdzenie zgłoszenia demo',
        text: replyContent.text,
        html: replyContent.html,
      });

      if (!queued) {
        this.logger.warn('Lead auto-reply queued synchronously.');
      }
    }
  }

  private buildAdminNotification(lead: {
    email: string;
    name: string;
    company: string;
    headcount: number | null;
    message: string | null;
  }) {
    const lines = [
      `Nowy lead demo KadryHR`,
      `Imię i nazwisko: ${lead.name}`,
      `Email: ${lead.email}`,
      `Firma: ${lead.company}`,
      `Liczba pracowników: ${lead.headcount ?? 'brak danych'}`,
      `Wiadomość: ${lead.message ?? '—'}`,
    ];

    return {
      text: lines.join('\n'),
      html: `
        <h2>Nowy lead demo KadryHR</h2>
        <ul>
          <li><strong>Imię i nazwisko:</strong> ${lead.name}</li>
          <li><strong>Email:</strong> ${lead.email}</li>
          <li><strong>Firma:</strong> ${lead.company}</li>
          <li><strong>Liczba pracowników:</strong> ${lead.headcount ?? 'brak danych'}</li>
          <li><strong>Wiadomość:</strong> ${lead.message ?? '—'}</li>
        </ul>
      `,
    };
  }

  private buildAutoReply(lead: { name: string; company: string }) {
    return {
      text: `Cześć ${lead.name},\n\nDziękujemy za zgłoszenie demo KadryHR. Wracamy z propozycją terminu do 24h (dni robocze).\n\nPozdrawiamy,\nZespół KadryHR`,
      html: `
        <p>Cześć ${lead.name},</p>
        <p>Dziękujemy za zgłoszenie demo KadryHR. Wracamy z propozycją terminu do 24h (dni robocze).</p>
        <p>Pozdrawiamy,<br />Zespół KadryHR</p>
      `,
    };
  }
}
