import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RcpTokenService } from './services/rcp-token.service';
import { RcpRateLimitService } from './services/rcp-rate-limit.service';
import { calculateHaversineDistance } from './utils/haversine.util';
import { RcpEventType, Prisma } from '@prisma/client';
import { CreateRcpCorrectionDto } from './dto/create-rcp-correction.dto';
import { ListRcpCorrectionsDto } from './dto/list-rcp-corrections.dto';
import { ReviewRcpCorrectionDto } from './dto/review-rcp-correction.dto';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-events';

export interface GenerateQrResult {
  qrUrl: string;
  tokenExpiresAt: Date;
}

export interface ClockResult {
  ok: boolean;
  distanceMeters: number;
  happenedAt: Date;
  locationName: string;
  type: RcpEventType;
}

export interface RcpStatusResult {
  lastEvent: {
    type: RcpEventType;
    happenedAt: Date;
    locationName: string;
  } | null;
  isClockedIn: boolean;
}

export interface MobileRcpSessionResult {
  organization: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    radiusMeters: number | null;
  };
  rcpStatus: {
    isClockedIn: boolean;
    lastPunchAt: Date | null;
    lastEventType: RcpEventType | null;
  };
}

export interface RcpEventListItem {
  id: string;
  type: RcpEventType;
  happenedAt: Date;
  locationId: string;
  locationName: string;
  distanceMeters: number;
  accuracyMeters: number | null;
  clientLat: number | null;
  clientLng: number | null;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface RcpEventListResult {
  total: number;
  skip: number;
  take: number;
  items: RcpEventListItem[];
}

export interface RcpCorrectionListResult {
  total: number;
  skip: number;
  take: number;
  items: Array<Record<string, unknown>>;
}

@Injectable()
export class RcpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: RcpTokenService,
    private readonly rateLimitService: RcpRateLimitService,
    private readonly auditService: AuditService,
  ) {}

  async generateQr(
    userId: string,
    organisationId: string,
    locationId: string,
    frontendBaseUrl: string,
  ): Promise<GenerateQrResult> {
    // Verify location exists and belongs to organisation
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        organisationId: organisationId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    if (!location.rcpEnabled) {
      throw new BadRequestException('RCP is not enabled for this location');
    }

    if (!location.geoLat || !location.geoLng || !location.geoRadiusMeters) {
      throw new BadRequestException(
        'Location does not have geolocation configured',
      );
    }

    // Get or create QR config for location
    let config = await this.prisma.rcpQrConfig.findUnique({
      where: { locationId },
    });

    if (!config) {
      config = await this.prisma.rcpQrConfig.create({
        data: {
          organisationId,
          locationId,
          tokenTtlSeconds: 3600, // Default 1 hour
          rotateMode: 'STATIC',
        },
      });
    }

    // Generate token
    const { token, expiresAt } = this.tokenService.generateToken(
      organisationId,
      locationId,
      config.tokenTtlSeconds,
    );

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        organisationId,
        actorUserId: userId,
        action: 'RCP_QR_GENERATE',
        entityType: 'Location',
        entityId: locationId,
        after: {
          locationId,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    const qrUrl = `${frontendBaseUrl}/m/rcp?token=${token}`;

    return {
      qrUrl,
      tokenExpiresAt: expiresAt,
    };
  }

  async clock(
    userId: string,
    organisationId: string,
    token: string,
    type: RcpEventType,
    clientLat: number,
    clientLng: number,
    accuracyMeters: number | undefined,
    clientTime: Date | undefined,
    userAgent: string | undefined,
    ip: string | undefined,
  ): Promise<ClockResult> {
    // 1. Verify token
    const payload = this.tokenService.verifyToken(token);
    if (!payload) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_TOKEN_EXPIRED',
        userAgent,
        ip,
      );
      throw new BadRequestException({
        code: 'RCP_TOKEN_EXPIRED',
        message: 'Token has expired or is invalid',
      });
    }

    // 2. Verify organisation matches
    if (payload.orgId !== organisationId) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_FORBIDDEN',
        userAgent,
        ip,
      );
      throw new ForbiddenException({
        code: 'RCP_FORBIDDEN',
        message: 'Token does not belong to your organisation',
      });
    }

    // 3. Get location
    const location = await this.prisma.location.findUnique({
      where: { id: payload.locationId },
    });

    if (!location || !location.rcpEnabled) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_FORBIDDEN',
        userAgent,
        ip,
      );
      throw new BadRequestException({
        code: 'RCP_FORBIDDEN',
        message: 'RCP is not enabled for this location',
      });
    }

    // 4. Rate limiting
    if (!this.rateLimitService.checkRateLimit(userId, location.id)) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_RATE_LIMIT',
        userAgent,
        ip,
      );
      throw new BadRequestException({
        code: 'RCP_RATE_LIMIT',
        message: 'Too many attempts. Please wait before trying again.',
      });
    }

    // 5. Check accuracy
    if (
      accuracyMeters !== undefined &&
      accuracyMeters > location.rcpAccuracyMaxMeters
    ) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_LOW_ACCURACY',
        userAgent,
        ip,
        location.id,
      );
      throw new BadRequestException({
        code: 'RCP_LOW_ACCURACY',
        message: `Location accuracy too low (${accuracyMeters}m > ${location.rcpAccuracyMaxMeters}m)`,
      });
    }

    // 6. Calculate distance
    const locationLat = parseFloat(location.geoLat!.toString());
    const locationLng = parseFloat(location.geoLng!.toString());
    const distanceMeters = calculateHaversineDistance(
      locationLat,
      locationLng,
      clientLat,
      clientLng,
    );

    // 7. Check geofence
    if (distanceMeters > location.geoRadiusMeters!) {
      await this.auditDenial(
        userId,
        organisationId,
        'RCP_OUTSIDE_GEOFENCE',
        userAgent,
        ip,
        location.id,
      );
      throw new BadRequestException({
        code: 'RCP_OUTSIDE_GEOFENCE',
        message: `You are outside the geofence (${distanceMeters}m > ${location.geoRadiusMeters}m)`,
      });
    }

    // 8. Check for double clock-in/out
    const lastEvent = await this.prisma.rcpEvent.findFirst({
      where: {
        userId,
        locationId: location.id,
      },
      orderBy: {
        happenedAt: 'desc',
      },
    });

    if (lastEvent) {
      if (type === 'CLOCK_IN' && lastEvent.type === 'CLOCK_IN') {
        await this.auditDenial(
          userId,
          organisationId,
          'RCP_ALREADY_CLOCKED_IN',
          userAgent,
          ip,
          location.id,
        );
        throw new BadRequestException({
          code: 'RCP_ALREADY_CLOCKED_IN',
          message: 'You are already clocked in. Please clock out first.',
        });
      }

      if (type === 'CLOCK_OUT' && lastEvent.type === 'CLOCK_OUT') {
        await this.auditDenial(
          userId,
          organisationId,
          'RCP_ALREADY_CLOCKED_OUT',
          userAgent,
          ip,
          location.id,
        );
        throw new BadRequestException({
          code: 'RCP_ALREADY_CLOCKED_OUT',
          message: 'You are already clocked out. Please clock in first.',
        });
      }
    }

    // 9. Create event
    const happenedAt = new Date();
    const tokenHash = this.tokenService.hashToken(token);

    const event = await this.prisma.rcpEvent.create({
      data: {
        organisationId,
        userId,
        locationId: location.id,
        type,
        happenedAt,
        clientTime: clientTime || null,
        clientLat: new Prisma.Decimal(clientLat),
        clientLng: new Prisma.Decimal(clientLng),
        accuracyMeters: accuracyMeters || null,
        distanceMeters,
        qrTokenHash: tokenHash,
        userAgent: userAgent || null,
        ip: ip || null,
      },
    });

    // 10. Audit log
    await this.prisma.auditLog.create({
      data: {
        organisationId,
        actorUserId: userId,
        action: type === 'CLOCK_IN' ? 'RCP_CLOCK_IN' : 'RCP_CLOCK_OUT',
        entityType: 'RcpEvent',
        entityId: event.id,
        after: {
          locationId: location.id,
          locationName: location.name,
          type,
          happenedAt: happenedAt.toISOString(),
          distanceMeters,
        },
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });

    return {
      ok: true,
      distanceMeters,
      happenedAt,
      locationName: location.name,
      type,
    };
  }

  async getMobileSession(
    userId: string,
    organisationId: string,
    token: string,
  ): Promise<MobileRcpSessionResult> {
    const tokenResult = this.tokenService.verifyTokenDetailed(token);
    if (tokenResult.error === 'rcp_token_invalid') {
      throw new BadRequestException({
        code: 'rcp_token_invalid',
        message: 'Token is invalid',
      });
    }

    if (tokenResult.error === 'rcp_token_expired') {
      throw new UnauthorizedException({
        code: 'rcp_token_expired',
        message: 'Token has expired',
      });
    }

    const payload = tokenResult.payload;
    if (!payload) {
      throw new BadRequestException({
        code: 'rcp_token_invalid',
        message: 'Token is invalid',
      });
    }

    if (payload.orgId !== organisationId) {
      throw new ForbiddenException({
        code: 'rcp_access_denied',
        message: 'Token does not belong to your organisation',
      });
    }

    const [organization, location] = await Promise.all([
      this.prisma.organisation.findUnique({
        where: { id: organisationId },
        select: { id: true, name: true },
      }),
      this.prisma.location.findFirst({
        where: {
          id: payload.locationId,
          organisationId,
          rcpEnabled: true,
        },
      }),
    ]);

    if (!organization || !location) {
      throw new ForbiddenException({
        code: 'rcp_access_denied',
        message: 'Access denied',
      });
    }

    const status = await this.getStatus(
      userId,
      organisationId,
      location.id,
    );

    return {
      organization,
      location: {
        id: location.id,
        name: location.name,
        address: this.formatLocationAddress(location),
        lat: location.geoLat ? Number(location.geoLat) : null,
        lng: location.geoLng ? Number(location.geoLng) : null,
        radiusMeters: location.geoRadiusMeters ?? null,
      },
      rcpStatus: {
        isClockedIn: status.isClockedIn,
        lastPunchAt: status.lastEvent?.happenedAt ?? null,
        lastEventType: status.lastEvent?.type ?? null,
      },
    };
  }

  async getStatus(
    userId: string,
    organisationId: string,
    locationId?: string,
  ): Promise<RcpStatusResult> {
    const whereClause: any = {
      userId,
      organisationId,
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const lastEvent = await this.prisma.rcpEvent.findFirst({
      where: whereClause,
      orderBy: {
        happenedAt: 'desc',
      },
      include: {
        location: true,
      },
    });

    if (!lastEvent) {
      return {
        lastEvent: null,
        isClockedIn: false,
      };
    }

    return {
      lastEvent: {
        type: lastEvent.type,
        happenedAt: lastEvent.happenedAt,
        locationName: lastEvent.location.name,
      },
      isClockedIn: lastEvent.type === 'CLOCK_IN',
    };
  }

  async listEventsForUser(
    userId: string,
    organisationId: string,
    query: {
      skip?: number;
      take?: number;
      type?: RcpEventType;
      locationId?: string;
      from?: string;
      to?: string;
    },
  ): Promise<RcpEventListResult> {
    const where = this.buildEventsWhereClause({
      organisationId,
      userId,
      locationId: query.locationId,
      type: query.type,
      from: query.from,
      to: query.to,
    });

    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    const [total, events] = await this.prisma.$transaction([
      this.prisma.rcpEvent.count({ where }),
      this.prisma.rcpEvent.findMany({
        where,
        orderBy: { happenedAt: 'desc' },
        skip,
        take,
        include: {
          location: true,
        },
      }),
    ]);

    return {
      total,
      skip,
      take,
      items: events.map((event) => ({
        id: event.id,
        type: event.type,
        happenedAt: event.happenedAt,
        locationId: event.locationId,
        locationName: event.location.name,
        distanceMeters: event.distanceMeters,
        accuracyMeters: event.accuracyMeters,
        clientLat: event.clientLat ? Number(event.clientLat) : null,
        clientLng: event.clientLng ? Number(event.clientLng) : null,
      })),
    };
  }

  async listEventsForOrganisation(
    organisationId: string,
    query: {
      skip?: number;
      take?: number;
      type?: RcpEventType;
      userId?: string;
      locationId?: string;
      from?: string;
      to?: string;
    },
  ): Promise<RcpEventListResult> {
    const where = this.buildEventsWhereClause({
      organisationId,
      userId: query.userId,
      locationId: query.locationId,
      type: query.type,
      from: query.from,
      to: query.to,
    });

    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    const [total, events] = await this.prisma.$transaction([
      this.prisma.rcpEvent.count({ where }),
      this.prisma.rcpEvent.findMany({
        where,
        orderBy: { happenedAt: 'desc' },
        skip,
        take,
        include: {
          location: true,
          user: true,
        },
      }),
    ]);

    return {
      total,
      skip,
      take,
      items: events.map((event) => ({
        id: event.id,
        type: event.type,
        happenedAt: event.happenedAt,
        locationId: event.locationId,
        locationName: event.location.name,
        distanceMeters: event.distanceMeters,
        accuracyMeters: event.accuracyMeters,
        clientLat: event.clientLat ? Number(event.clientLat) : null,
        clientLng: event.clientLng ? Number(event.clientLng) : null,
        user: {
          id: event.user.id,
          firstName: event.user.firstName,
          lastName: event.user.lastName,
          email: event.user.email,
        },
      })),
    };
  }

  private buildEventsWhereClause(params: {
    organisationId: string;
    userId?: string;
    locationId?: string;
    type?: RcpEventType;
    from?: string;
    to?: string;
  }): Prisma.RcpEventWhereInput {
    const filters: Prisma.RcpEventWhereInput[] = [
      { organisationId: params.organisationId },
    ];

    if (params.userId) {
      filters.push({ userId: params.userId });
    }

    if (params.locationId) {
      filters.push({ locationId: params.locationId });
    }

    if (params.type) {
      filters.push({ type: params.type });
    }

    if (params.from || params.to) {
      const happenedAt: Prisma.DateTimeFilter = {};
      if (params.from) {
        happenedAt.gte = new Date(params.from);
      }
      if (params.to) {
        happenedAt.lte = new Date(params.to);
      }
      filters.push({ happenedAt });
    }

    return filters.length > 1 ? { AND: filters } : filters[0];
  }

  private formatLocationAddress(location: {
    address?: string | null;
    addressStreet?: string | null;
    addressPostalCode?: string | null;
    addressCity?: string | null;
    addressCountry?: string | null;
  }): string | null {
    if (location.address) {
      return location.address;
    }

    const parts = [
      location.addressStreet,
      location.addressPostalCode,
      location.addressCity,
      location.addressCountry,
    ].filter((part) => part && part.trim().length > 0);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  private async auditDenial(
    userId: string,
    organisationId: string,
    reason: string,
    userAgent?: string,
    ip?: string,
    locationId?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organisationId,
        actorUserId: userId,
        action: 'RCP_DENIED',
        entityType: 'RcpEvent',
        entityId: locationId || null,
        after: {
          reason,
        },
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });
  }

  async createCorrection(
    userId: string,
    organisationId: string,
    dto: CreateRcpCorrectionDto,
  ) {
    const event = await this.prisma.rcpEvent.findFirst({
      where: {
        id: dto.eventId,
        organisationId,
        userId,
      },
    });

    if (!event) {
      throw new NotFoundException('RCP event not found');
    }

    const existingPending = await (this.prisma as any).rcpCorrection.findFirst({
      where: {
        eventId: dto.eventId,
        status: 'PENDING',
      },
    });
    if (existingPending) {
      throw new BadRequestException('Pending correction already exists for this event');
    }

    return (this.prisma as any).rcpCorrection.create({
      data: {
        organisationId,
        eventId: dto.eventId,
        requestedByUserId: userId,
        requestedType: dto.requestedType,
        requestedHappenedAt: new Date(dto.requestedHappenedAt),
        reason: dto.reason,
      },
    });
  }

  async listCorrectionsForUser(
    userId: string,
    organisationId: string,
    query: ListRcpCorrectionsDto,
  ): Promise<RcpCorrectionListResult> {
    const where: Record<string, unknown> = {
      organisationId,
      requestedByUserId: userId,
    };
    if (query.status) where.status = query.status;

    const [total, items] = await this.prisma.$transaction([
      (this.prisma as any).rcpCorrection.count({ where }),
      (this.prisma as any).rcpCorrection.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: {
          event: { include: { location: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return { total, skip: query.skip, take: query.take, items };
  }

  async listCorrectionsForOrganisation(
    organisationId: string,
    query: ListRcpCorrectionsDto,
  ): Promise<RcpCorrectionListResult> {
    const where: Record<string, unknown> = { organisationId };
    if (query.status) where.status = query.status;

    const [total, items] = await this.prisma.$transaction([
      (this.prisma as any).rcpCorrection.count({ where }),
      (this.prisma as any).rcpCorrection.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          event: { include: { location: true, user: true } },
          requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return { total, skip: query.skip, take: query.take, items };
  }

  async reviewCorrection(
    id: string,
    reviewerUserId: string,
    organisationId: string,
    dto: ReviewRcpCorrectionDto,
  ) {
    const correction = await (this.prisma as any).rcpCorrection.findFirst({
      where: { id, organisationId },
    });
    if (!correction) {
      throw new NotFoundException('Correction not found');
    }
    if (correction.status !== 'PENDING') {
      throw new BadRequestException('Correction already reviewed');
    }

    const updatedCorrection = await this.prisma.$transaction(async (tx) => {
      const nextCorrection = await (tx as any).rcpCorrection.update({
        where: { id },
        data: {
          status: dto.decision,
          managerNote: dto.managerNote || null,
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
        },
      });

      if (dto.decision === 'APPROVED') {
        await tx.rcpEvent.update({
          where: { id: correction.eventId },
          data: {
            type: correction.requestedType,
            happenedAt: correction.requestedHappenedAt,
          },
        });
      }

      return nextCorrection;
    });

    await this.auditService.record({
      organisationId,
      actorUserId: reviewerUserId,
      action:
        dto.decision === 'APPROVED'
          ? AUDIT_ACTIONS.RCP_CORRECTION_APPROVE
          : AUDIT_ACTIONS.RCP_CORRECTION_REJECT,
      entityType: 'rcp_correction',
      entityId: id,
      after: {
        correctionId: id,
        decision: dto.decision,
      },
    });

    return updatedCorrection;
  }

  async getActiveWorkforce(organisationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organisationId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const active: Array<Record<string, unknown>> = [];
    for (const user of users) {
      const last = await this.prisma.rcpEvent.findFirst({
        where: { organisationId, userId: user.id },
        include: { location: true },
        orderBy: { happenedAt: 'desc' },
      });
      if (last?.type === 'CLOCK_IN') {
        active.push({
          user,
          location: { id: last.location.id, name: last.location.name },
          happenedAt: last.happenedAt,
        });
      }
    }

    return { activeCount: active.length, items: active };
  }

  async getDailySummary(organisationId: string, date?: string) {
    const source = date ? new Date(date) : new Date();
    const start = new Date(source);
    start.setHours(0, 0, 0, 0);
    const end = new Date(source);
    end.setHours(23, 59, 59, 999);

    const [clockInCount, clockOutCount, pendingCorrections] = await Promise.all([
      this.prisma.rcpEvent.count({ where: { organisationId, type: 'CLOCK_IN', happenedAt: { gte: start, lte: end } } }),
      this.prisma.rcpEvent.count({ where: { organisationId, type: 'CLOCK_OUT', happenedAt: { gte: start, lte: end } } }),
      (this.prisma as any).rcpCorrection.count({ where: { organisationId, status: 'PENDING' } }),
    ]);

    return {
      date: start.toISOString().slice(0, 10),
      clockInCount,
      clockOutCount,
      pendingCorrections,
    };
  }
}
