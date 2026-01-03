import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';
import { Permission } from '../../auth/permissions';
import type { ExecutionContext } from '@nestjs/common';

function createContext(user: unknown): ExecutionContext {
  const getRequest = jest.fn().mockReturnValue({ user });
  return {
    switchToHttp: () => ({ getRequest }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows access when no permissions are required', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const guard = new PermissionsGuard(reflector);
    const context = createContext({ role: Role.EMPLOYEE });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws when user missing on request', () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.EMPLOYEE_MANAGE]);

    const guard = new PermissionsGuard(reflector);
    const context = createContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies when user lacks required permission', () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.REPORT_EXPORT]);

    const guard = new PermissionsGuard(reflector);
    const context = createContext({
      role: Role.MANAGER,
      permissions: [Permission.EMPLOYEE_MANAGE],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows when role mapping grants permission', () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.RCP_EDIT]);

    const guard = new PermissionsGuard(reflector);
    const context = createContext({
      role: Role.OWNER,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
