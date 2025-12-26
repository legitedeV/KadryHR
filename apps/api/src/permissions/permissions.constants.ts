export interface PermissionDefinition {
  name: string;
  displayName: string;
  description: string;
  module: string;
  category: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    name: 'employees.view',
    displayName: 'Przeglądanie pracowników',
    description: 'Dostęp do listy pracowników w organizacji',
    module: 'employees',
    category: 'view',
  },
  {
    name: 'employees.create',
    displayName: 'Dodawanie pracowników',
    description: 'Tworzenie nowych rekordów pracowników',
    module: 'employees',
    category: 'create',
  },
  {
    name: 'employees.edit',
    displayName: 'Edycja pracowników',
    description: 'Aktualizacja danych pracowników',
    module: 'employees',
    category: 'edit',
  },
  {
    name: 'employees.deactivate',
    displayName: 'Dezaktywacja pracowników',
    description: 'Wyłączanie dostępu pracowników',
    module: 'employees',
    category: 'manage',
  },
  {
    name: 'invites.manage',
    displayName: 'Zarządzanie zaproszeniami',
    description: 'Tworzenie, ponowne wysyłanie oraz odwoływanie zaproszeń',
    module: 'invites',
    category: 'manage',
  },
  {
    name: 'permissions.manage',
    displayName: 'Zarządzanie rolami i uprawnieniami',
    description: 'Aktualizacja ról członków organizacji',
    module: 'permissions',
    category: 'manage',
  },
  {
    name: 'dashboard.view',
    displayName: 'Podgląd dashboardu',
    description: 'Dostęp do podsumowania organizacji',
    module: 'dashboard',
    category: 'view',
  },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: PERMISSION_DEFINITIONS.map((perm) => perm.name),
  ADMIN: [
    'dashboard.view',
    'employees.view',
    'employees.create',
    'employees.edit',
    'employees.deactivate',
    'invites.manage',
    'permissions.manage',
  ],
  MANAGER: ['dashboard.view', 'employees.view', 'employees.edit', 'invites.manage'],
  EMPLOYEE: ['dashboard.view', 'employees.view'],
};
