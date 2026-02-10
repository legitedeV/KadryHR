import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AuditService } from '../audit/audit.service';
import { Weekday } from '@prisma/client';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapUserAvatar<T extends { avatarPath?: string | null; avatarUrl?: string | null }>(
    user: T,
  ): Omit<T, 'avatarPath'> {
    const { avatarPath, ...rest } = user;
    return {
      ...(rest as Omit<T, 'avatarPath'>),
      avatarUrl: this.buildAvatarUrl(avatarPath ?? null, user.avatarUrl ?? null),
    };
  }

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

  create(ownerId: string, data: CreateOrganisationDto) {
    return this.prisma.organisation.create({
      data: {
        ...data,
        deliveryDays: data.deliveryDays ?? [],
        promotionCycleStartDate: data.promotionCycleStartDate
          ? new Date(data.promotionCycleStartDate)
          : null,
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

    const updateData: any = { ...data };

    // Handle date conversion for promotionCycleStartDate
    if (data.promotionCycleStartDate !== undefined) {
      updateData.promotionCycleStartDate = data.promotionCycleStartDate
        ? new Date(data.promotionCycleStartDate)
        : null;
    }

    const updated = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: updateData,
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
        avatarPath: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }).then((users) => users.map((user) => this.mapUserAvatar(user)));
  }

  /**
   * Calculate schedule metadata for a date range (delivery days, promotion labels)
   */
  async getScheduleMetadata(
    organisationId: string,
    from: Date,
    to: Date,
  ): Promise<{
    deliveryDays: string[];
    promotionDays: Array<{
      date: string;
      type: 'ZMIANA_PROMOCJI' | 'MALA_PROMOCJA';
    }>;
    holidays: string[];
  }> {
    const DAYS_IN_WEEK = 7;
    const TUESDAY = 2; // JS day number for Tuesday
    const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

    const org = await this.findOne(organisationId);

    const deliveryDays: string[] = [];
    const promotionDays: Array<{
      date: string;
      type: 'ZMIANA_PROMOCJI' | 'MALA_PROMOCJA';
    }> = [];

    // Map Weekday enum to JS day numbers (0 = Sunday, 1 = Monday, etc.)
    const weekdayToJsDay: Record<Weekday, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const deliveryWeekdays = (org.deliveryDays || []).map(
      (d) => weekdayToJsDay[d],
    );

    // Iterate through each day in the range
    const current = new Date(from);
    while (current <= to) {
      const dateStr = current.toISOString().slice(0, 10);
      const jsDay = current.getDay();

      // Check if this is a delivery day
      if (deliveryWeekdays.includes(jsDay)) {
        deliveryDays.push(dateStr);
      }

      // Check for promotion days (every second Tuesday from start date)
      if (org.promotionCycleStartDate && org.promotionCycleFrequency) {
        const startDate = new Date(org.promotionCycleStartDate);
        const daysDiff = Math.floor(
          (current.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY,
        );

        // Check if this is a Tuesday
        if (jsDay === TUESDAY && daysDiff >= 0) {
          const cyclePosition = daysDiff % (org.promotionCycleFrequency * 2);

          if (cyclePosition < DAYS_IN_WEEK) {
            // First Tuesday in the 2-week cycle = ZMIANA PROMOCJI
            promotionDays.push({ date: dateStr, type: 'ZMIANA_PROMOCJI' });
          } else if (
            cyclePosition >= org.promotionCycleFrequency &&
            cyclePosition < org.promotionCycleFrequency + DAYS_IN_WEEK
          ) {
            // Second Tuesday in the 2-week cycle = MALA PROMOCJA
            promotionDays.push({ date: dateStr, type: 'MALA_PROMOCJA' });
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      deliveryDays,
      promotionDays,
      holidays: (org.holidays ?? []).filter((holiday) => holiday >= from.toISOString().slice(0, 10) && holiday <= to.toISOString().slice(0, 10)),
    };
  }
}
