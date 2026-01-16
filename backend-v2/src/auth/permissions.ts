import { Role } from '@prisma/client';

export enum Permission {
  // Schedule management
  SCHEDULE_MANAGE = 'SCHEDULE_MANAGE',
  SCHEDULE_VIEW = 'SCHEDULE_VIEW',

  // Leave/Request management
  LEAVE_APPROVE = 'LEAVE_APPROVE',
  LEAVE_REQUEST = 'LEAVE_REQUEST',

  // Employee management
  EMPLOYEE_MANAGE = 'EMPLOYEE_MANAGE',
  EMPLOYEE_VIEW = 'EMPLOYEE_VIEW',

  // Organisation settings
  ORGANISATION_SETTINGS = 'ORGANISATION_SETTINGS',

  // Audit logs
  AUDIT_VIEW = 'AUDIT_VIEW',

  // Reports
  REPORTS_EXPORT = 'REPORTS_EXPORT',

  // Availability management
  AVAILABILITY_MANAGE = 'AVAILABILITY_MANAGE',

  // Branding / logo proposals
  BRANDING_VIEW = 'BRANDING_VIEW',
  BRANDING_MANAGE = 'BRANDING_MANAGE',

  // Legacy aliases for backward compatibility
  RCP_EDIT = 'RCP_EDIT',
  REPORT_EXPORT = 'REPORT_EXPORT',
}

// Default role permissions (can be overridden per organisation)
const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.SCHEDULE_MANAGE,
    Permission.SCHEDULE_VIEW,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REQUEST,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_VIEW,
    Permission.ORGANISATION_SETTINGS,
    Permission.AUDIT_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.AVAILABILITY_MANAGE,
    Permission.BRANDING_VIEW,
    Permission.BRANDING_MANAGE,
    Permission.RCP_EDIT,
    Permission.REPORT_EXPORT,
  ],
  [Role.ADMIN]: [
    Permission.SCHEDULE_MANAGE,
    Permission.SCHEDULE_VIEW,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REQUEST,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_VIEW,
    Permission.AUDIT_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.AVAILABILITY_MANAGE,
    Permission.BRANDING_VIEW,
    Permission.BRANDING_MANAGE,
    Permission.RCP_EDIT,
    Permission.REPORT_EXPORT,
  ],
  [Role.MANAGER]: [
    Permission.SCHEDULE_MANAGE,
    Permission.SCHEDULE_VIEW,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REQUEST,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_VIEW,
    Permission.AVAILABILITY_MANAGE,
    Permission.BRANDING_VIEW,
    Permission.BRANDING_MANAGE,
    Permission.RCP_EDIT,
  ],
  [Role.EMPLOYEE]: [
    Permission.SCHEDULE_VIEW,
    Permission.LEAVE_REQUEST,
    Permission.EMPLOYEE_VIEW,
    Permission.BRANDING_VIEW,
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}

export function getDefaultRolePermissions(): Record<Role, Permission[]> {
  return { ...DEFAULT_ROLE_PERMISSIONS };
}

// List of all configurable permissions (excluding legacy aliases)
export const CONFIGURABLE_PERMISSIONS: Permission[] = [
  Permission.SCHEDULE_MANAGE,
  Permission.SCHEDULE_VIEW,
  Permission.LEAVE_APPROVE,
  Permission.LEAVE_REQUEST,
  Permission.EMPLOYEE_MANAGE,
  Permission.EMPLOYEE_VIEW,
  Permission.ORGANISATION_SETTINGS,
  Permission.AUDIT_VIEW,
  Permission.REPORTS_EXPORT,
  Permission.AVAILABILITY_MANAGE,
  Permission.BRANDING_VIEW,
  Permission.BRANDING_MANAGE,
];

// Permission labels in Polish for UI
export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.SCHEDULE_MANAGE]: 'Zarządzanie grafikiem',
  [Permission.SCHEDULE_VIEW]: 'Podgląd grafiku',
  [Permission.LEAVE_APPROVE]: 'Akceptowanie wniosków',
  [Permission.LEAVE_REQUEST]: 'Składanie wniosków',
  [Permission.EMPLOYEE_MANAGE]: 'Zarządzanie pracownikami',
  [Permission.EMPLOYEE_VIEW]: 'Podgląd pracowników',
  [Permission.ORGANISATION_SETTINGS]: 'Ustawienia organizacji',
  [Permission.AUDIT_VIEW]: 'Podgląd logów audytu',
  [Permission.REPORTS_EXPORT]: 'Eksport raportów',
  [Permission.AVAILABILITY_MANAGE]: 'Zarządzanie dostępnością',
  [Permission.BRANDING_VIEW]: 'Podgląd logo',
  [Permission.BRANDING_MANAGE]: 'Zarządzanie propozycjami logo',
  [Permission.RCP_EDIT]: 'Edycja grafiku (legacy)',
  [Permission.REPORT_EXPORT]: 'Eksport raportów (legacy)',
};
