import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogAction = string;

export type AuditJson =
  | Prisma.InputJsonValue
  | Prisma.NullableJsonNullValueInput;

export interface AuditLogEntryInput {
  organisationId: string;
  actorUserId: string;
  action: AuditLogAction;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

const toAuditJson = (value: unknown): AuditJson => {
  if (value === undefined || value === null) return Prisma.JsonNull;
  if (value instanceof Date) return value.toISOString();

  const valueType = typeof value;
  if (
    valueType === 'string' ||
    valueType === 'number' ||
    valueType === 'boolean'
  ) {
    return value as AuditJson;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toAuditJson(entry));
  }

  if (valueType === 'object') {
    const result: Record<string, AuditJson> = {};
    for (const [key, inner] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = toAuditJson(inner);
    }
    return result;
  }

  // Fallback to string representation for unsupported types (e.g., bigint, symbol)
  if (
    value &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    return (value as { toString: () => string }).toString();
  }

  return '[unserializable]';
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntryInput) {
    if (!entry.organisationId || !entry.actorUserId) {
      this.logger.warn(
        `Audit entry skipped due to missing organisationId or actorUserId for action ${entry.action}`,
      );
      return null;
    }

    const before = toAuditJson(entry.before);
    const after = toAuditJson(entry.after);

    return this.prisma.auditLog.create({
      data: {
        organisationId: entry.organisationId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before,
        after,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  }
}
