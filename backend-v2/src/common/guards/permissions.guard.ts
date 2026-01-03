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

  private resolvePermissions(user: AuthenticatedUser): Permission[] {
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }
    return getPermissionsForRole(user.role);
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
