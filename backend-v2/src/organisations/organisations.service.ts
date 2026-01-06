import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  create(ownerId: string, data: CreateOrganisationDto) {
    return this.prisma.organisation.create({
      data: {
        ...data,
        users: {
          connect: { id: ownerId },
        },
      },
    });
  }

  async findOne(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  async update(
    organisationId: string,
    data: UpdateOrganisationDto,
    actorUserId?: string,
  ) {
    const before = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    const updated = await this.prisma.organisation.update({
      where: { id: organisationId },
      data,
    });

    if (actorUserId) {
      await this.auditService.record({
        organisationId,
        actorUserId,
        action: 'UPDATE',
        entityType: 'organisation',
        entityId: organisationId,
        before,
        after: updated,
      });
    }

    return updated;
  }

  async getMembers(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
