import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InviteStatus, MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.invite.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, dto: CreateInviteDto, createdById?: string) {
    await this.ensureRoleIsAssignable(dto.role);

    const existing = await this.prisma.invite.findFirst({
      where: { orgId, email: dto.email, status: InviteStatus.PENDING },
    });

    if (existing) {
      throw new BadRequestException('Pending invite already exists for this email');
    }

    return this.prisma.invite.create({
      data: {
        orgId,
        email: dto.email,
        role: dto.role,
        token: randomUUID(),
        createdById,
      },
    });
  }

  async resend(orgId: string, id: string) {
    const invite = await this.prisma.invite.findFirst({ where: { id, orgId } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be resent');
    }

    return this.prisma.invite.update({
      where: { id },
      data: {
        lastSentAt: new Date(),
        resendCount: invite.resendCount + 1,
      },
    });
  }

  async revoke(orgId: string, id: string) {
    const invite = await this.prisma.invite.findFirst({ where: { id, orgId } });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be revoked');
    }

    return this.prisma.invite.update({ where: { id }, data: { status: InviteStatus.REVOKED } });
  }

  private async ensureRoleIsAssignable(role: MembershipRole) {
    const allowedRoles: MembershipRole[] = [
      MembershipRole.ADMIN,
      MembershipRole.MANAGER,
      MembershipRole.EMPLOYEE,
    ];

    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Invite role is not assignable');
    }
  }
}
