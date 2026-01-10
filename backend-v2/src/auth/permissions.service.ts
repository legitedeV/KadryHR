import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Role, PermissionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  Permission,
  getPermissionsForRole,
  CONFIGURABLE_PERMISSIONS,
  PERMISSION_LABELS,
  getDefaultRolePermissions,
} from './permissions';
import type { AuthenticatedUser } from './types/authenticated-user.type';

export interface PermissionMatrix {
  role: Role;
  permissions: Array<{
    permission: Permission;
    label: string;
    enabled: boolean;
  }>;
}

export interface RoleDescription {
  role: Role;
  label: string;
  description: string;
  permissions: string[];
}

/**
 * Role labels in Polish
 */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.OWNER]: 'Właściciel',
  [Role.ADMIN]: 'Administrator',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Pracownik',
};

/**
 * Role descriptions in Polish
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.OWNER]:
    'Pełny dostęp do wszystkich funkcji organizacji. Może zarządzać członkami zespołu, ustawieniami i grafikami.',
  [Role.ADMIN]:
    'Dostęp do większości funkcji administracyjnych. Może zarządzać pracownikami i grafikami.',
  [Role.MANAGER]:
    'Może zarządzać grafikami, zatwierdzać wnioski i edytować dane pracowników.',
  [Role.EMPLOYEE]:
    'Dostęp tylko do własnych danych, grafiku i możliwość składania wniosków.',
};

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has required permission
   */
  hasPermission(user: AuthenticatedUser, permission: Permission): boolean {
    if (!user) return false;

    // Use user's explicit permissions if available, otherwise fall back to role defaults
    const userPermissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : getPermissionsForRole(user.role);

    return userPermissions.includes(permission);
  }

  /**
   * Check if user has ANY of the required permissions
   */
  hasAnyPermission(
    user: AuthenticatedUser,
    permissions: Permission[],
  ): boolean {
    return permissions.some((p) => this.hasPermission(user, p));
  }

  /**
   * Check if user has ALL of the required permissions
   */
  hasAllPermissions(
    user: AuthenticatedUser,
    permissions: Permission[],
  ): boolean {
    return permissions.every((p) => this.hasPermission(user, p));
  }

  /**
   * Require specific permission - throws ForbiddenException if not granted
   */
  requirePermission(user: AuthenticatedUser, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenException(
        `Brak wymaganych uprawnień: ${PERMISSION_LABELS[permission] ?? permission}`,
      );
    }
  }

  /**
   * Require any of the specified permissions
   */
  requireAnyPermission(
    user: AuthenticatedUser,
    permissions: Permission[],
  ): void {
    if (!this.hasAnyPermission(user, permissions)) {
      const labels = permissions.map((p) => PERMISSION_LABELS[p] ?? p);
      throw new ForbiddenException(
        `Brak wymaganych uprawnień: ${labels.join(' lub ')}`,
      );
    }
  }

  /**
   * Check if user can manage employees
   */
  canManageEmployees(user: AuthenticatedUser): boolean {
    return this.hasPermission(user, Permission.EMPLOYEE_MANAGE);
  }

  /**
   * Check if user can edit schedule
   */
  canEditSchedule(user: AuthenticatedUser): boolean {
    return (
      this.hasPermission(user, Permission.SCHEDULE_MANAGE) ||
      this.hasPermission(user, Permission.RCP_EDIT)
    );
  }

  /**
   * Check if user can approve leave requests
   */
  canApproveLeave(user: AuthenticatedUser): boolean {
    return this.hasPermission(user, Permission.LEAVE_APPROVE);
  }

  /**
   * Check if user can access organisation settings
   */
  canAccessOrganisationSettings(user: AuthenticatedUser): boolean {
    return this.hasPermission(user, Permission.ORGANISATION_SETTINGS);
  }

  /**
   * Check if user can view audit logs
   */
  canViewAuditLogs(user: AuthenticatedUser): boolean {
    return this.hasPermission(user, Permission.AUDIT_VIEW);
  }

  /**
   * Check if a user can change another user's role
   * Only OWNERs can change roles, and they cannot demote themselves
   */
  canChangeUserRole(
    actor: AuthenticatedUser,
    targetUserId: string,
    _newRole: Role,
  ): { allowed: boolean; reason?: string } {
    // Only owners can change roles
    if (actor.role !== Role.OWNER) {
      return {
        allowed: false,
        reason: 'Tylko właściciel może zmieniać role użytkowników',
      };
    }

    // Cannot change own role (protection against self-demotion)
    if (actor.id === targetUserId) {
      return { allowed: false, reason: 'Nie można zmienić własnej roli' };
    }

    return { allowed: true };
  }

  /**
   * Get all roles with their descriptions for UI display
   */
  getRoleDescriptions(): RoleDescription[] {
    const defaultPermissions = getDefaultRolePermissions();

    return Object.values(Role).map((role) => ({
      role,
      label: ROLE_LABELS[role],
      description: ROLE_DESCRIPTIONS[role],
      permissions: (defaultPermissions[role] ?? [])
        .filter((p) => CONFIGURABLE_PERMISSIONS.includes(p))
        .map((p) => PERMISSION_LABELS[p] ?? p),
    }));
  }

  /**
   * Get permission matrix for a role
   */
  getPermissionMatrixForRole(role: Role): PermissionMatrix {
    const rolePermissions = getPermissionsForRole(role);

    return {
      role,
      permissions: CONFIGURABLE_PERMISSIONS.map((permission) => ({
        permission,
        label: PERMISSION_LABELS[permission] ?? permission,
        enabled: rolePermissions.includes(permission),
      })),
    };
  }

  /**
   * Get custom organisation permissions if they exist,
   * otherwise return default role permissions
   */
  async getOrganisationPermissions(
    organisationId: string,
    role: Role,
  ): Promise<Permission[]> {
    const customPermissions = await this.prisma.rolePermission.findMany({
      where: { organisationId, role, enabled: true },
    });

    if (customPermissions.length > 0) {
      return customPermissions.map(
        (p) => p.permission as unknown as Permission,
      );
    }

    return getPermissionsForRole(role);
  }

  /**
   * Check if user is an elevated role (Owner, Admin, Manager)
   */
  isElevatedRole(user: AuthenticatedUser): boolean {
    return [Role.OWNER, Role.ADMIN, Role.MANAGER].includes(user.role);
  }
}
