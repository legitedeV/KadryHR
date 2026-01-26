import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_LOG_METADATA, AuditLogOptions } from './audit-log.decorator';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  private readonly beforeFetchers: Record<
    string,
    (organisationId: string, id: string) => Promise<unknown>
  > = {
    employee: (organisationId, id) =>
      this.prisma.employee.findFirst({ where: { id, organisationId } }),
    shift: (organisationId, id) =>
      this.prisma.shift.findFirst({ where: { id, organisationId } }),
    availability: (organisationId, id) =>
      this.prisma.availability.findFirst({ where: { id, organisationId } }),
  };

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

    const ip = this.resolveIp(request);
    const userAgent = request.headers?.['user-agent'] ?? undefined;

    const before =
      metadata.fetchBefore && entityId
        ? await this.fetchBefore(
            metadata.entityType,
            user.organisationId,
            entityId,
          )
        : undefined;

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      tap(async (result) => {
        let after: unknown;
        if (result !== undefined) {
          after = result;
        } else if (metadata.captureBody) {
          after = request.body;
        }

        const resolvedEntityId = entityId ?? this.extractEntityId(after);

        try {
          await this.auditService.log({
            organisationId: user.organisationId,
            actorUserId: user.id,
            action: metadata.action,
            entityType: metadata.entityType,
            entityId: resolvedEntityId,
            before: before ?? null,
            after: after ?? null,
            ip,
            userAgent,
          });
        } catch (error) {
          // Audit logging failures are non-blocking; warn and continue.
          this.logger.warn(
            `Audit logging skipped (${metadata.action}): ${(error as Error).message}`,
          );
        }
      }),
    );
  }

  private fetchBefore(entityType: string, organisationId: string, id: string) {
    const fetcher = this.beforeFetchers[entityType];
    return fetcher ? fetcher(organisationId, id) : undefined;
  }

  private resolveIp(request: RequestWithUser) {
    if (request.ip) return request.ip;
    return request.socket?.remoteAddress;
  }

  private extractEntityId(value: unknown): string | undefined {
    if (
      value &&
      typeof value === 'object' &&
      'id' in (value as Record<string, unknown>)
    ) {
      const candidate = (value as Record<string, unknown>).id;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }
    return undefined;
  }
}
