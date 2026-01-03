import { Role } from '@prisma/client';

export enum Permission {
  EMPLOYEE_MANAGE = 'EMPLOYEE_MANAGE',
  RCP_EDIT = 'RCP_EDIT',
  LEAVE_APPROVE = 'LEAVE_APPROVE',
  REPORT_EXPORT = 'REPORT_EXPORT',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.EMPLOYEE_MANAGE,
    Permission.RCP_EDIT,
    Permission.LEAVE_APPROVE,
    Permission.REPORT_EXPORT,
  ],
  [Role.MANAGER]: [
    Permission.EMPLOYEE_MANAGE,
    Permission.RCP_EDIT,
    Permission.LEAVE_APPROVE,
  ],
  [Role.EMPLOYEE]: [],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
