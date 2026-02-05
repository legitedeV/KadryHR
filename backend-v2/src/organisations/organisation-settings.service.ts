import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  Role,
  SchedulePeriodType,
  Weekday,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import {
  CreateOrganisationLocationDto,
  UpdateOrganisationLocationDto,
} from './dto/organisation-location.dto';
import { UpdateScheduleSettingsDto } from './dto/update-schedule-settings.dto';
import {
  CreateOrganisationInvitationDto,
  UpdateOrganisationMemberRoleDto,
} from './dto/organisation-member.dto';
import { InvitationsService } from '../auth/invitations.service';

@Injectable()
export class OrganisationSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly invitationsService: InvitationsService,
  ) {}

  private buildAvatarUrl(
    avatarPath?: string | null,
    legacyUrl?: string | null,
  ): string | null {
    const pathValue = avatarPath || legacyUrl;
    if (!pathValue) return null;
    if (pathValue.startsWith('http')) return pathValue;
    if (pathValue.startsWith('/static/')) return pathValue;
    if (pathValue.startsWith('static/')) return `/${pathValue}`;
    if (pathValue.startsWith('avatars/')) return `/static/${pathValue}`;
    return pathValue;
  }

  private deriveNameParts(email: string) {
    const localPart = email.split('@')[0] ?? '';
    const cleaned = localPart.replace(/[^a-zA-Z0-9.\u00C0-\u024F_-]/g, ' ');
    const segments = cleaned
      .split(/[._-]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      return {
        firstName: segments[0].slice(0, 120),
        lastName: segments.slice(1).join(' ').slice(0, 120),
      };
    }

    const fallback = localPart.slice(0, 120) || email.slice(0, 120);
    return {
      firstName: fallback,
      lastName: fallback,
    };
  }

  async getOrganisationDetails(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  async updateOrganisationDetails(
    organisationId: string,
    dto: UpdateOrganisationDto,
    actorUserId: string,
  ) {
    const before = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!before) {
      throw new NotFoundException('Organisation not found');
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.promotionCycleStartDate !== undefined) {
      updateData.promotionCycleStartDate = dto.promotionCycleStartDate
        ? new Date(dto.promotionCycleStartDate)
        : null;
    }

    const updated = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: updateData,
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'organisation',
      entityId: organisationId,
      before,
      after: updated,
    });

    return updated;
  }

  async getScheduleSettings(organisationId: string) {
    const organisation = await this.getOrganisationDetails(organisationId);

    return {
      defaultWorkdayStart: organisation.defaultWorkdayStart ?? '08:00',
      defaultWorkdayEnd: organisation.defaultWorkdayEnd ?? '16:00',
      defaultBreakMinutes: organisation.defaultBreakMinutes ?? 30,
      workDays: organisation.workDays ?? [],
      schedulePeriod: organisation.schedulePeriod ?? SchedulePeriodType.WEEKLY,
    };
  }

  async updateScheduleSettings(
    organisationId: string,
    dto: UpdateScheduleSettingsDto,
    actorUserId: string,
  ) {
    const before = await this.getOrganisationDetails(organisationId);

    const updated = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: dto,
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'organisation-schedule-settings',
      entityId: organisationId,
      before: {
        defaultWorkdayStart: before.defaultWorkdayStart,
        defaultWorkdayEnd: before.defaultWorkdayEnd,
        defaultBreakMinutes: before.defaultBreakMinutes,
        workDays: before.workDays,
        schedulePeriod: before.schedulePeriod,
      },
      after: {
        defaultWorkdayStart: updated.defaultWorkdayStart,
        defaultWorkdayEnd: updated.defaultWorkdayEnd,
        defaultBreakMinutes: updated.defaultBreakMinutes,
        workDays: updated.workDays,
        schedulePeriod: updated.schedulePeriod,
      },
    });

    return {
      defaultWorkdayStart: updated.defaultWorkdayStart,
      defaultWorkdayEnd: updated.defaultWorkdayEnd,
      defaultBreakMinutes: updated.defaultBreakMinutes,
      workDays: updated.workDays,
      schedulePeriod: updated.schedulePeriod,
    };
  }

  async listLocations(organisationId: string) {
    return this.prisma.location.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLocation(
    organisationId: string,
    dto: CreateOrganisationLocationDto,
    actorUserId: string,
  ) {
    const location = await this.prisma.location.create({
      data: {
        organisationId,
        name: dto.name,
        code: dto.code ?? null,
        addressStreet: dto.addressStreet ?? null,
        addressPostalCode: dto.addressPostalCode ?? null,
        addressCity: dto.addressCity ?? null,
        addressCountry: dto.addressCountry ?? null,
        defaultOpeningTimeFrom: dto.defaultOpeningTimeFrom ?? null,
        defaultOpeningTimeTo: dto.defaultOpeningTimeTo ?? null,
        isActive: dto.isActive ?? true,
        address: dto.address ?? dto.addressStreet ?? undefined,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'CREATE',
      entityType: 'location',
      entityId: location.id,
      after: location,
    });

    return location;
  }

  async updateLocation(
    organisationId: string,
    locationId: string,
    dto: UpdateOrganisationLocationDto,
    actorUserId: string,
  ) {
    const existing = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    const updateData: Record<string, unknown> = {
      ...dto,
    };

    if (dto.address !== undefined) {
      updateData.address = dto.address ?? null;
    } else if (dto.addressStreet !== undefined) {
      updateData.address = dto.addressStreet ?? null;
    }

    const updated = await this.prisma.location.update({
      where: { id: locationId },
      data: updateData,
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'location',
      entityId: locationId,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async toggleLocation(
    organisationId: string,
    locationId: string,
    actorUserId: string,
  ) {
    const existing = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    const updated = await this.prisma.location.update({
      where: { id: locationId },
      data: { isActive: !existing.isActive },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'location-status',
      entityId: locationId,
      before: { isActive: existing.isActive },
      after: { isActive: updated.isActive },
    });

    return updated;
  }

  async listMembers(organisationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organisationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        avatarPath: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            invitations: {
              where: { status: InvitationStatus.PENDING },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: this.buildAvatarUrl(user.avatarPath, user.avatarUrl),
      status: user.employee?.invitations?.length ? 'INVITED' : 'ACTIVE',
    }));
  }

  async updateMemberRole(
    organisationId: string,
    actorUserId: string,
    actorRole: Role,
    memberId: string,
    dto: UpdateOrganisationMemberRoleDto,
  ) {
    if (actorUserId === memberId) {
      throw new BadRequestException('Nie można zmienić własnej roli');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
    });

    if (!member) {
      throw new NotFoundException('User not found');
    }

    const restrictedRoles = [Role.OWNER, Role.ADMIN];
    if (restrictedRoles.includes(dto.role) && actorRole !== Role.OWNER) {
      throw new ForbiddenException(
        'Tylko właściciel może nadawać role OWNER lub ADMIN',
      );
    }

    if (member.role === Role.OWNER && dto.role !== Role.OWNER) {
      const ownersCount = await this.prisma.user.count({
        where: { organisationId, role: Role.OWNER },
      });

      if (ownersCount <= 1) {
        throw new BadRequestException(
          'Nie można odebrać roli ostatniemu właścicielowi',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: memberId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        avatarPath: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'user-role',
      entityId: memberId,
      before: { role: member.role },
      after: { role: dto.role },
    });

    return {
      ...updated,
      avatarUrl: this.buildAvatarUrl(updated.avatarPath, updated.avatarUrl),
    };
  }

  async inviteMember(
    organisationId: string,
    actorUserId: string,
    actorRole: Role,
    dto: CreateOrganisationInvitationDto,
  ) {
    const restrictedRoles = [Role.OWNER, Role.ADMIN];
    if (restrictedRoles.includes(dto.role) && actorRole !== Role.OWNER) {
      throw new ForbiddenException(
        'Tylko właściciel może zapraszać z rolą OWNER lub ADMIN',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.organisationId !== organisationId) {
      throw new BadRequestException(
        'Użytkownik z tym e-mailem istnieje w innej organizacji',
      );
    }

    if (dto.locationId) {
      await this.validateLocationForOrganisation(organisationId, dto.locationId);
    }

    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        organisationId,
        email: dto.email,
        isDeleted: false,
      },
    });

    const nameParts = this.deriveNameParts(dto.email);

    if (existingEmployee && dto.locationId) {
      const assignment = await this.prisma.locationAssignment.findFirst({
        where: {
          organisationId,
          employeeId: existingEmployee.id,
          locationId: dto.locationId,
        },
      });

      if (!assignment) {
        await this.prisma.locationAssignment.create({
          data: {
            organisationId,
            employeeId: existingEmployee.id,
            locationId: dto.locationId,
          },
        });
      }
    }

    const employee =
      existingEmployee ??
      (await this.prisma.employee.create({
        data: {
          organisationId,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: dto.email,
          locations: dto.locationId
            ? {
                create: {
                  organisationId,
                  locationId: dto.locationId,
                },
              }
            : undefined,
        },
      }));

    await this.invitationsService.issueInvitation({
      organisationId,
      employeeId: employee.id,
      invitedEmail: dto.email,
      invitedByUserId: actorUserId,
      action: 'issue',
    });

    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (invitedUser) {
      await this.prisma.user.update({
        where: { id: invitedUser.id },
        data: { role: dto.role },
      });
    }

    return { success: true };
  }

  async deactivateMember(
    organisationId: string,
    actorUserId: string,
    actorRole: Role,
    memberId: string,
  ) {
    if (actorUserId === memberId) {
      throw new BadRequestException('Nie można dezaktywować własnego konta');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, organisationId },
    });

    if (!member) {
      throw new NotFoundException('User not found');
    }

    if (member.role === Role.OWNER) {
      throw new BadRequestException('Nie można dezaktywować właściciela');
    }

    if (member.role === Role.ADMIN && actorRole !== Role.OWNER) {
      throw new ForbiddenException(
        'Tylko właściciel może dezaktywować administratora',
      );
    }

    await this.prisma.user.delete({
      where: { id: memberId },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'DELETE',
      entityType: 'user',
      entityId: memberId,
      before: {
        email: member.email,
        role: member.role,
        firstName: member.firstName,
        lastName: member.lastName,
      },
    });

    return { success: true };
  }

  async validateLocationForOrganisation(
    organisationId: string,
    locationId: string,
  ) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
      select: { id: true },
    });

    if (!location) {
      throw new BadRequestException('Nieprawidłowa lokalizacja');
    }
  }
}
