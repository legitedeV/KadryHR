import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_LOG_METADATA, AuditLogOptions } from './audit-log.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const metadata = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.organisationId || !user.id) {
      return next.handle();
    }

    const entityId =
      metadata.entityIdParam && request.params
        ? request.params[metadata.entityIdParam]
        : undefined;

    const ip =
      request.ip ||
      (Array.isArray(request.ips) && request.ips.length ? request.ips[0] : '') ||
      (request.socket as any)?.remoteAddress;
    const userAgent =
      (request.headers?.['user-agent'] as string | undefined) ?? undefined;

    const before =
      metadata.fetchBefore && entityId
        ? await this.fetchBefore(metadata.entityType, user.organisationId, entityId)
        : metadata.captureBody
          ? request.body
          : undefined;

    return next.handle().pipe(
      tap(async (result) => {
        const after =
          metadata.captureBody && result === undefined ? request.body : result;

        try {
          await this.auditService.log({
            organisationId: user.organisationId,
            actorUserId: user.id,
            action: metadata.action,
            entityType: metadata.entityType,
            entityId:
              entityId ??
              (after && typeof after === 'object' && 'id' in (after as any)
                ? (after as any).id
                : undefined),
            before,
            after,
            ip,
            userAgent,
          });
        } catch {
          // Audyt nie może blokować głównego flow — ignorujemy błędy logowania.
        }
      }),
    );
  }

  private fetchBefore(entityType: string, organisationId: string, id: string) {
    if (entityType === 'employee') {
      return this.prisma.employee.findFirst({
        where: { id, organisationId },
      });
    }

    if (entityType === 'shift') {
      return this.prisma.shift.findFirst({
        where: { id, organisationId },
      });
    }

    if (entityType === 'availability') {
      return this.prisma.availability.findFirst({
        where: { id, organisationId },
      });
    }

    return undefined;
  }
}
