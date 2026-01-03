import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogAction = string;

export interface AuditLogEntryInput {
  organisationId: string;
  actorUserId: string;
  action: AuditLogAction;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
}

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

    return this.prisma.auditLog.create({
      data: {
        organisationId: entry.organisationId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: entry.before ?? Prisma.JsonNull,
        after: entry.after ?? Prisma.JsonNull,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  }
}
