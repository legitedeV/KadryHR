import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { InvitationStatus, Role } from '@prisma/client';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { EmailTemplatesService } from '../email/email-templates.service';

interface InvitationContext {
  organisationId: string;
  employeeId: string;
  invitedEmail: string;
  invitedByUserId: string;
  action?: 'issue' | 'resend';
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly emailTemplates: EmailTemplatesService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildInvitationLink(token: string) {
    const baseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'https://kadryhr.pl';

    return `${baseUrl.replace(/\/$/, '')}/auth/accept-invitation?token=${token}`;
  }

  async validateInvitation(token: string) {
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.employeeInvitation.findFirst({
      where: {
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        organisation: true,
        employee: true,
      },
    });

    if (!invitation) {
      throw new BadRequestException(
        'Zaproszenie jest nieprawidłowe lub wygasło',
      );
    }

    return {
      organisationName: invitation.organisation.name,
      invitedEmail: invitation.invitedEmail,
      employee: {
        firstName: invitation.employee.firstName,
        lastName: invitation.employee.lastName,
      },
      expiresAt: invitation.expiresAt,
    };
  }

  private async ensureUser(
    organisationId: string,
    email: string,
    names?: {
      firstName?: string | null;
      lastName?: string | null;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.organisationId !== organisationId) {
        throw new ForbiddenException(
          'Użytkownik z tym e-mailem istnieje w innej organizacji',
        );
      }
      return existing;
    }

    const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    return this.prisma.user.create({
      data: {
        email,
        organisationId,
        passwordHash,
        role: Role.EMPLOYEE,
        firstName: names?.firstName ?? undefined,
        lastName: names?.lastName ?? undefined,
      },
    });
  }

  async issueInvitation(context: InvitationContext) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: context.employeeId,
        organisationId: context.organisationId,
      },
      include: {
        organisation: {
          select: { id: true, name: true },
        },
        user: { select: { id: true } },
        invitations: {
          where: { status: InvitationStatus.ACCEPTED },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const targetEmail = employee.email ?? context.invitedEmail;
    if (!targetEmail) {
      throw new BadRequestException(
        'Pracownik nie ma przypisanego adresu e-mail',
      );
    }

    if (employee.invitations.length > 0) {
      throw new BadRequestException('Pracownik ma już aktywne konto');
    }

    const recentPending = await this.prisma.employeeInvitation.findFirst({
      where: {
        employeeId: employee.id,
        status: InvitationStatus.PENDING,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recentPending) {
      throw new BadRequestException(
        'Zaproszenie zostało już wysłane w ciągu ostatnich 10 minut',
      );
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const inviter = await this.prisma.user.findUnique({
      where: { id: context.invitedByUserId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const user = await this.ensureUser(context.organisationId, targetEmail, {
      firstName: employee.firstName,
      lastName: employee.lastName,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.employeeInvitation.updateMany({
        where: {
          employeeId: employee.id,
          status: InvitationStatus.PENDING,
        },
        data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
      });

      await tx.employeeInvitation.create({
        data: {
          organisationId: employee.organisationId,
          employeeId: employee.id,
          invitedEmail: targetEmail,
          tokenHash,
          expiresAt,
        },
      });

      if (!employee.userId) {
        await tx.employee.update({
          where: { id: employee.id },
          data: { userId: user.id },
        });
      }

      await tx.auditLog.create({
        data: {
          organisationId: employee.organisationId,
          actorUserId: context.invitedByUserId,
          action:
            context.action === 'resend'
              ? 'employee.invitation_resent'
              : 'employee.invitation_issued',
          entityType: 'employee',
          entityId: employee.id,
          after: {
            invitedEmail: targetEmail,
            expiresAt,
          },
        },
      });
    });

    const invitationLink = this.buildInvitationLink(token);
    const inviterName =
      inviter?.firstName || inviter?.lastName
        ? `${inviter?.firstName ?? ''} ${inviter?.lastName ?? ''}`.trim()
        : null;

    const emailTemplate = this.emailTemplates.invitationTemplate({
      organisationName: employee.organisation.name,
      invitationLink,
      inviteeName: `${employee.firstName} ${employee.lastName}`.trim(),
      inviterName,
      expiresIn: '24 godziny',
    });

    await this.queueService.addEmailDeliveryJob({
      to: targetEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
      organisationId: employee.organisationId,
      userId: user.id,
    });

    return { success: true };
  }

  async acceptInvitation(
    token: string,
    password: string,
    res: Response,
    options?: { phone?: string | null; acceptTerms?: boolean },
  ) {
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.employeeInvitation.findFirst({
      where: {
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        employee: true,
      },
    });

    if (!invitation) {
      throw new BadRequestException(
        'Zaproszenie jest nieprawidłowe lub wygasło',
      );
    }

    const user = await this.ensureUser(
      invitation.organisationId,
      invitation.invitedEmail,
      {
        firstName: invitation.employee.firstName,
        lastName: invitation.employee.lastName,
      },
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.employeeInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });

      const passwordHash = await bcrypt.hash(password, 10);

      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          firstName: invitation.employee.firstName,
          lastName: invitation.employee.lastName,
          role: Role.EMPLOYEE,
        },
      });

      await tx.employee.update({
        where: { id: invitation.employeeId },
        data: {
          userId: user.id,
          phone: options?.phone ?? invitation.employee.phone,
          email: invitation.invitedEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          organisationId: invitation.organisationId,
          actorUserId: user.id,
          action: 'employee.invitation.accepted',
          entityType: 'employee',
          entityId: invitation.employeeId,
          after: { invitationId: invitation.id },
        },
      });
    });

    return this.authService.login(invitation.invitedEmail, password, res);
  }
}
