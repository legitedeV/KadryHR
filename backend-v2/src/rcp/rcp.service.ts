import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RcpTokenService } from './services/rcp-token.service';
import { RcpRateLimitService } from './services/rcp-rate-limit.service';
import { calculateHaversineDistance } from './utils/haversine.util';
import { RcpEventType, Prisma } from '@prisma/client';

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

@Injectable()
export class RcpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: RcpTokenService,
    private readonly rateLimitService: RcpRateLimitService,
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
}
