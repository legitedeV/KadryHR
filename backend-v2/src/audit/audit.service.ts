import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type AuditJson = Prisma.InputJsonValue;

export interface AuditLogPayload {
  organisationId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
}

/**
 * Konwersja dowolnej wartości na typ zgodny z Prisma.Json
 * (InputJsonValue) – rekurencyjnie dla tablic i obiektów.
 */
function toAuditJson(value: unknown): AuditJson {
  // prymitywy + null lecą wprost
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as AuditJson;
  }

  // tablice – rekurencyjnie po elementach
  if (Array.isArray(value)) {
    return value.map((entry) => toAuditJson(entry)) as AuditJson;
  }

  // obiekty – rekurencyjnie po kluczach
  if (typeof value === 'object') {
    const result: Record<string, AuditJson> = {};

    for (const [key, v] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = toAuditJson(v);
    }

    return result as AuditJson;
  }

  // fallback – cokolwiek innego zamieniamy na string
  return String(value) as AuditJson;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Główna metoda – zapis pojedynczego wpisu audytowego.
   * Używana przez interceptor i inne moduły.
   */
  async record(payload: AuditLogPayload): Promise<void> {
    const { organisationId, actorUserId } = payload;

    if (!organisationId || !actorUserId) {
      this.logger.warn(
        `Audit entry skipped due to missing organisationId or actorUserId for action ${payload.action}`,
      );
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          organisationId,
          actorUserId,
          action: payload.action,
          entityType: payload.entityType ?? null,
          entityId: payload.entityId ?? null,
          before:
            typeof payload.before === 'undefined'
              ? null
              : toAuditJson(payload.before),
          after:
            typeof payload.after === 'undefined'
              ? null
              : toAuditJson(payload.after),
          ip: payload.ip ?? null,
          userAgent: payload.userAgent ?? null,
          // jeżeli w modelu jest pole metadata/meta – łatwo tu je podpiąć:
          // metadata: payload.metadata ? toAuditJson(payload.metadata) : null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to write audit log for action ${payload.action}`,
        (err as Error)?.stack ?? String(err),
      );
    }
  }

  /**
   * Alias, żeby zachować kompatybilność – inne miejsca
   * mogą wołać `log(...)` zamiast `record(...)`.
   */
  async log(payload: AuditLogPayload): Promise<void> {
    return this.record(payload);
  }

  /**
   * Drugi alias – gdyby jakieś testy / stare miejsca wołały `create(...)`.
   */
  async create(payload: AuditLogPayload): Promise<void> {
    return this.record(payload);
  }
}
