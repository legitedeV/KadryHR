import { Injectable } from '@nestjs/common';
import {
  LeaveCategory,
  PermissionType,
  Role,
  SchedulePeriodType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ORGANISATION_MODULES } from '../common/constants/organisation-modules.constant';

const DEFAULT_SHIFT_PRESETS = [
  { code: 'MORNING', name: 'Rano', startMinutes: 360, endMinutes: 840, sortOrder: 0 },
  { code: 'AFTERNOON', name: 'Popołudnie', startMinutes: 840, endMinutes: 1320, sortOrder: 1 },
  { code: 'NIGHT', name: 'Noc', startMinutes: 1320, endMinutes: 360, sortOrder: 2 },
  { code: 'MIDSHIFT', name: 'Międzyzmiana', startMinutes: 600, endMinutes: 1080, sortOrder: 3 },
] as const;

const DEFAULT_LEAVE_TYPES = [
  { name: 'Urlop wypoczynkowy', code: LeaveCategory.PAID_LEAVE, isPaid: true },
  { name: 'Urlop na żądanie', code: LeaveCategory.PAID_LEAVE, isPaid: true },
  { name: 'L4', code: LeaveCategory.SICK, isPaid: true },
  { name: 'Bezpłatny', code: LeaveCategory.UNPAID, isPaid: false },
] as const;

const DEFAULT_ROLE_PERMISSIONS: ReadonlyArray<{
  role: Role;
  permissions: ReadonlyArray<PermissionType>;
}> = [
  { role: Role.OWNER, permissions: Object.values(PermissionType) },
  {
    role: Role.MANAGER,
    permissions: [
      PermissionType.SCHEDULE_MANAGE,
      PermissionType.SCHEDULE_VIEW,
      PermissionType.EMPLOYEE_MANAGE,
      PermissionType.EMPLOYEE_VIEW,
      PermissionType.LEAVE_APPROVE,
      PermissionType.LEAVE_REQUEST,
    ],
  },
  {
    role: Role.EMPLOYEE,
    permissions: [PermissionType.SCHEDULE_VIEW, PermissionType.LEAVE_REQUEST],
  },
];

@Injectable()
export class OrganisationBootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapOrganisation(organisationId: string) {
    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        schedulePeriod: SchedulePeriodType.MONTHLY,
        timezone: 'Europe/Warsaw',
        dailyWorkNormHours: 8,
        requireScheduleValidationBeforePublish: true,
        enabledModules: DEFAULT_ORGANISATION_MODULES,
      },
    });

    for (const preset of DEFAULT_SHIFT_PRESETS) {
      await this.prisma.shiftPreset.upsert({
        where: { organisationId_code: { organisationId, code: preset.code } },
        update: {
          name: preset.name,
          startMinutes: preset.startMinutes,
          endMinutes: preset.endMinutes,
          sortOrder: preset.sortOrder,
          isDefault: true,
          isActive: true,
        },
        create: {
          organisationId,
          code: preset.code,
          name: preset.name,
          startMinutes: preset.startMinutes,
          endMinutes: preset.endMinutes,
          sortOrder: preset.sortOrder,
          isDefault: true,
          isActive: true,
        },
      });
    }

    for (const leaveType of DEFAULT_LEAVE_TYPES) {
      await this.prisma.leaveType.upsert({
        where: { organisationId_name: { organisationId, name: leaveType.name } },
        update: { code: leaveType.code, isPaid: leaveType.isPaid, isActive: true },
        create: {
          organisationId,
          name: leaveType.name,
          code: leaveType.code,
          isPaid: leaveType.isPaid,
          isActive: true,
        },
      });
    }

    for (const rolePermission of DEFAULT_ROLE_PERMISSIONS) {
      for (const permission of rolePermission.permissions) {
        await this.prisma.rolePermission.upsert({
          where: {
            organisationId_role_permission: {
              organisationId,
              role: rolePermission.role,
              permission,
            },
          },
          update: { enabled: true },
          create: {
            organisationId,
            role: rolePermission.role,
            permission,
            enabled: true,
          },
        });
      }
    }
  }
}
