import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getPermissionsForRole, Permission } from '../../auth/permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private expandLegacyPermissions(permissions: Permission[]): Permission[] {
    const expanded = new Set(permissions);
    if (expanded.has(Permission.SCHEDULE_MANAGE)) {
      expanded.add(Permission.RCP_EDIT);
    }
    if (expanded.has(Permission.RCP_EDIT)) {
      expanded.add(Permission.SCHEDULE_MANAGE);
    }
    if (expanded.has(Permission.REPORTS_EXPORT)) {
      expanded.add(Permission.REPORT_EXPORT);
    }
    if (expanded.has(Permission.REPORT_EXPORT)) {
      expanded.add(Permission.REPORTS_EXPORT);
    }
    return Array.from(expanded);
  }

  private resolvePermissions(user: AuthenticatedUser): Permission[] {
    if (user.permissions && user.permissions.length > 0) {
      return this.expandLegacyPermissions(user.permissions);
    }
    return this.expandLegacyPermissions(getPermissionsForRole(user.role));
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Missing authenticated user in request');
    }

    const userPermissions = this.resolvePermissions(user);

    const hasAll = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        'Insufficient permissions for this resource',
      );
    }

    return true;
  }
}
