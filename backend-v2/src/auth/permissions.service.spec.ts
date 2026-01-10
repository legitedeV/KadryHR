import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  PermissionsService,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from './permissions.service';
import { Permission } from './permissions';
import type { AuthenticatedUser } from './types/authenticated-user.type';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: { rolePermission: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = {
      rolePermission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new PermissionsService(prisma as any);
  });

  const createUser = (
    overrides: Partial<AuthenticatedUser> = {},
  ): AuthenticatedUser => ({
    id: 'user-1',
    email: 'test@example.com',
    organisationId: 'org-1',
    role: Role.EMPLOYEE,
    permissions: [],
    ...overrides,
  });

  describe('hasPermission', () => {
    it('returns false for null user', () => {
      expect(
        service.hasPermission(null as any, Permission.EMPLOYEE_MANAGE),
      ).toBe(false);
    });

    it('uses explicit permissions when provided', () => {
      const user = createUser({
        role: Role.EMPLOYEE,
        permissions: [Permission.EMPLOYEE_MANAGE],
      });

      expect(service.hasPermission(user, Permission.EMPLOYEE_MANAGE)).toBe(
        true,
      );
    });

    it('falls back to role defaults when no explicit permissions', () => {
      const owner = createUser({
        role: Role.OWNER,
        permissions: [],
      });

      // OWNERs have EMPLOYEE_MANAGE by default
      expect(service.hasPermission(owner, Permission.EMPLOYEE_MANAGE)).toBe(
        true,
      );
    });

    it('returns false when employee lacks permission', () => {
      const user = createUser({
        role: Role.EMPLOYEE,
        permissions: [],
      });

      expect(service.hasPermission(user, Permission.EMPLOYEE_MANAGE)).toBe(
        false,
      );
    });
  });

  describe('requirePermission', () => {
    it('throws ForbiddenException when permission missing', () => {
      const user = createUser({ role: Role.EMPLOYEE });

      expect(() =>
        service.requirePermission(user, Permission.EMPLOYEE_MANAGE),
      ).toThrow(ForbiddenException);
    });

    it('does not throw when permission granted', () => {
      const user = createUser({ role: Role.OWNER });

      expect(() =>
        service.requirePermission(user, Permission.EMPLOYEE_MANAGE),
      ).not.toThrow();
    });
  });

  describe('canManageEmployees', () => {
    it('returns true for owner', () => {
      const user = createUser({ role: Role.OWNER });
      expect(service.canManageEmployees(user)).toBe(true);
    });

    it('returns true for manager', () => {
      const user = createUser({ role: Role.MANAGER });
      expect(service.canManageEmployees(user)).toBe(true);
    });

    it('returns false for employee', () => {
      const user = createUser({ role: Role.EMPLOYEE });
      expect(service.canManageEmployees(user)).toBe(false);
    });
  });

  describe('canEditSchedule', () => {
    it('returns true for manager with RCP_EDIT', () => {
      const user = createUser({ role: Role.MANAGER });
      expect(service.canEditSchedule(user)).toBe(true);
    });

    it('returns false for employee', () => {
      const user = createUser({ role: Role.EMPLOYEE });
      expect(service.canEditSchedule(user)).toBe(false);
    });
  });

  describe('canApproveLeave', () => {
    it('returns true for manager', () => {
      const user = createUser({ role: Role.MANAGER });
      expect(service.canApproveLeave(user)).toBe(true);
    });

    it('returns false for employee', () => {
      const user = createUser({ role: Role.EMPLOYEE });
      expect(service.canApproveLeave(user)).toBe(false);
    });
  });

  describe('canChangeUserRole', () => {
    it('allows owner to change other user role', () => {
      const actor = createUser({ id: 'owner-1', role: Role.OWNER });
      const result = service.canChangeUserRole(actor, 'user-2', Role.MANAGER);

      expect(result.allowed).toBe(true);
    });

    it('prevents owner from changing own role', () => {
      const actor = createUser({ id: 'owner-1', role: Role.OWNER });
      const result = service.canChangeUserRole(actor, 'owner-1', Role.MANAGER);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('własnej roli');
    });

    it('prevents non-owner from changing roles', () => {
      const actor = createUser({ id: 'manager-1', role: Role.MANAGER });
      const result = service.canChangeUserRole(actor, 'user-2', Role.EMPLOYEE);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('właściciel');
    });
  });

  describe('getRoleDescriptions', () => {
    it('returns descriptions for all roles', () => {
      const descriptions = service.getRoleDescriptions();

      expect(descriptions.length).toBe(Object.values(Role).length);
      expect(descriptions.find((d) => d.role === Role.OWNER)).toBeDefined();
      expect(descriptions.find((d) => d.role === Role.EMPLOYEE)).toBeDefined();
    });

    it('includes labels and descriptions', () => {
      const descriptions = service.getRoleDescriptions();
      const ownerDesc = descriptions.find((d) => d.role === Role.OWNER);

      expect(ownerDesc?.label).toBe(ROLE_LABELS[Role.OWNER]);
      expect(ownerDesc?.description).toBe(ROLE_DESCRIPTIONS[Role.OWNER]);
    });
  });

  describe('isElevatedRole', () => {
    it('returns true for owner', () => {
      const user = createUser({ role: Role.OWNER });
      expect(service.isElevatedRole(user)).toBe(true);
    });

    it('returns true for manager', () => {
      const user = createUser({ role: Role.MANAGER });
      expect(service.isElevatedRole(user)).toBe(true);
    });

    it('returns true for admin', () => {
      const user = createUser({ role: Role.ADMIN });
      expect(service.isElevatedRole(user)).toBe(true);
    });

    it('returns false for employee', () => {
      const user = createUser({ role: Role.EMPLOYEE });
      expect(service.isElevatedRole(user)).toBe(false);
    });
  });
});
