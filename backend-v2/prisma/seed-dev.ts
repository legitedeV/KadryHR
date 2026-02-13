import bcrypt from 'bcrypt';
import {
  LeaveCategory,
  LeaveStatus,
  PermissionType,
  PrismaClient,
  RcpEventType,
  Role,
  SchedulePeriodType,
  ScheduleStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash } from 'crypto';

const DEV_ORG_ID = '7b50ad9e-22d3-4adc-a9e9-ce3b1458ff11';
const DEV_LOCATION_ID = '1e6469be-8f53-4584-a83e-20a43a8cc279';
const DEV_OWNER_ID = '2f3e3dc5-d90b-42f7-a3d6-aa7bc4c5acb7';

const EMPLOYEES = [
  ['a8e6c4a6-2bc4-4fbe-b9e3-b46d9f0cb1a1', 'Jan', 'Kowalski'],
  ['24fcd3d4-8448-4df2-b65d-4bc1d9ceaf87', 'Anna', 'Nowak'],
  ['f9920e70-f0ac-4d77-8ce7-2014fdd72eb9', 'Piotr', 'Zieliński'],
  ['7686c1be-0b31-4cb8-a412-fec2c31d4b5a', 'Katarzyna', 'Wiśniewska'],
  ['fca6ace9-6a7f-4327-a146-ac7f0ffeb81c', 'Michał', 'Wójcik'],
  ['8495f571-7c39-4cc4-a610-0d4d8044dbec', 'Agnieszka', 'Kaczmarek'],
  ['3f88c93a-e54a-4ef2-baff-db3ac89ff3c8', 'Tomasz', 'Mazur'],
  ['f350de58-ec13-4d5f-a2d1-4010686fd006', 'Monika', 'Krawczyk'],
  ['20dc6cbf-d3a2-4a05-83b9-4a6698acc2da', 'Paweł', 'Dudek'],
  ['73358fff-c6f3-4d20-adb1-a682f284f2aa', 'Ewa', 'Król'],
] as const;

const SHIFT_PRESETS = [
  { code: 'MORNING', name: 'Rano', startMinutes: 360, endMinutes: 840, sortOrder: 0 },
  { code: 'AFTERNOON', name: 'Popołudnie', startMinutes: 840, endMinutes: 1320, sortOrder: 1 },
  { code: 'NIGHT', name: 'Noc', startMinutes: 1320, endMinutes: 360, sortOrder: 2 },
  { code: 'MIDSHIFT', name: 'Międzyzmiana', startMinutes: 600, endMinutes: 1080, sortOrder: 3 },
] as const;

function makeRng(seed: number) {
  let current = seed;
  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed:dev');
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('seed:dev is blocked in production environment');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.organisation.deleteMany({ where: { id: DEV_ORG_ID } });

  const passwordHash = await bcrypt.hash('Dev123!.!.', 10);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const organisation = await prisma.organisation.create({
    data: {
      id: DEV_ORG_ID,
      name: 'KadryHR DEV',
      contactEmail: 'dev@kadryhr.local',
      timezone: 'Europe/Warsaw',
      schedulePeriod: SchedulePeriodType.MONTHLY,
      dailyWorkNormHours: 8,
      requireScheduleValidationBeforePublish: true,
      enabledModules: {
        grafik: true,
        dyspozycje: true,
        rcp: true,
        urlopy: true,
        raporty: true,
      },
    },
  });

  const owner = await prisma.user.create({
    data: {
      id: DEV_OWNER_ID,
      email: 'admin@kadryhr.local',
      passwordHash,
      role: Role.OWNER,
      firstName: 'Dev',
      lastName: 'Admin',
      organisationId: organisation.id,
    },
  });

  await prisma.employee.create({
    data: {
      organisationId: organisation.id,
      userId: owner.id,
      firstName: 'Dev',
      lastName: 'Admin',
      email: owner.email,
      position: 'Owner',
    },
  });

  await prisma.location.create({
    data: {
      id: DEV_LOCATION_ID,
      organisationId: organisation.id,
      name: 'Biuro Warszawa DEV',
      address: 'ul. Prosta 70, Warszawa',
      rcpEnabled: true,
      geoLat: 52.232222,
      geoLng: 20.984444,
      geoRadiusMeters: 150,
    },
  });

  for (const preset of SHIFT_PRESETS) {
    await prisma.shiftPreset.create({
      data: {
        organisationId: organisation.id,
        ...preset,
        isDefault: true,
        isActive: true,
      },
    });
  }

  await prisma.leaveType.createMany({
    data: [
      { organisationId: organisation.id, name: 'Urlop wypoczynkowy', code: LeaveCategory.PAID_LEAVE, isPaid: true },
      { organisationId: organisation.id, name: 'Urlop na żądanie', code: LeaveCategory.PAID_LEAVE, isPaid: true },
      { organisationId: organisation.id, name: 'L4', code: LeaveCategory.SICK, isPaid: true },
      { organisationId: organisation.id, name: 'Bezpłatny', code: LeaveCategory.UNPAID, isPaid: false },
    ],
  });

  for (const permission of Object.values(PermissionType)) {
    await prisma.rolePermission.create({
      data: { organisationId: organisation.id, role: Role.OWNER, permission, enabled: true },
    });
  }

  const managerPermissions = [
    PermissionType.SCHEDULE_MANAGE,
    PermissionType.SCHEDULE_VIEW,
    PermissionType.EMPLOYEE_MANAGE,
    PermissionType.EMPLOYEE_VIEW,
    PermissionType.LEAVE_APPROVE,
    PermissionType.LEAVE_REQUEST,
  ];
  for (const permission of managerPermissions) {
    await prisma.rolePermission.create({
      data: { organisationId: organisation.id, role: Role.MANAGER, permission, enabled: true },
    });
  }
  for (const permission of [PermissionType.SCHEDULE_VIEW, PermissionType.LEAVE_REQUEST]) {
    await prisma.rolePermission.create({
      data: { organisationId: organisation.id, role: Role.EMPLOYEE, permission, enabled: true },
    });
  }

  await prisma.employee.createMany({
    data: EMPLOYEES.map(([id, firstName, lastName], index) => ({
      id,
      organisationId: organisation.id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@kadryhr.local`,
      position: index % 2 === 0 ? 'Specjalista' : 'Koordynator',
    })),
  });

  const employees = await prisma.employee.findMany({
    where: { organisationId: organisation.id, userId: null },
    orderBy: { firstName: 'asc' },
  });

  const period = await prisma.schedulePeriod.create({
    data: {
      organisationId: organisation.id,
      locationId: DEV_LOCATION_ID,
      from: monthStart,
      to: monthEnd,
      status: ScheduleStatus.DRAFT,
      version: 1,
    },
  });

  const rng = makeRng(20261215);
  const shifts: Parameters<typeof prisma.shift.createMany>[0]['data'] = [];

  employees.forEach((employee, index) => {
    for (let day = 1; day <= 12; day++) {
      const shiftDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 0, 0, 0));
      const roll = rng();
      if (roll < 0.2) {
        continue;
      }

      const preset = SHIFT_PRESETS[(index + day) % SHIFT_PRESETS.length];
      const start = new Date(shiftDate);
      start.setUTCMinutes(preset.startMinutes);
      const end = new Date(shiftDate);
      end.setUTCMinutes(preset.endMinutes);
      if (preset.endMinutes <= preset.startMinutes) {
        end.setUTCDate(end.getUTCDate() + 1);
      }

      shifts.push({
        organisationId: organisation.id,
        periodId: period.id,
        employeeId: employee.id,
        locationId: DEV_LOCATION_ID,
        startsAt: start,
        endsAt: end,
        status: ScheduleStatus.DRAFT,
        createdById: owner.id,
        updatedById: owner.id,
        note: `${preset.name} DEV`,
      });
    }
  });

  if (shifts.length) {
    await prisma.shift.createMany({ data: shifts });
  }

  const leaveTypes = await prisma.leaveType.findMany({ where: { organisationId: organisation.id } });
  const paidLeave = leaveTypes.find((leaveType) => leaveType.name === 'Urlop wypoczynkowy');
  const sickLeave = leaveTypes.find((leaveType) => leaveType.name === 'L4');

  if (!paidLeave || !sickLeave) {
    throw new Error('Expected leave types were not created');
  }

  await prisma.leaveRequest.createMany({
    data: [
      {
        organisationId: organisation.id,
        employeeId: employees[0].id,
        createdByUserId: owner.id,
        approvedByUserId: owner.id,
        type: LeaveCategory.PAID_LEAVE,
        leaveTypeId: paidLeave.id,
        status: LeaveStatus.APPROVED,
        startDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 7)),
        endDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 9)),
        reason: 'Planowany wypoczynek',
      },
      {
        organisationId: organisation.id,
        employeeId: employees[1].id,
        createdByUserId: owner.id,
        type: LeaveCategory.SICK,
        leaveTypeId: sickLeave.id,
        status: LeaveStatus.PENDING,
        startDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 12)),
        endDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 13)),
        reason: 'Samopoczucie',
      },
    ],
  });

  const qrTokenHash = createHash('sha256').update('kadryhr-dev-qr-token').digest('hex');
  await prisma.rcpEvent.createMany({
    data: [
      {
        organisationId: organisation.id,
        userId: owner.id,
        locationId: DEV_LOCATION_ID,
        type: RcpEventType.CLOCK_IN,
        happenedAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3, 5, 55, 0)),
        clientTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3, 5, 55, 0)),
        clientLat: 52.232222,
        clientLng: 20.984444,
        accuracyMeters: 30,
        distanceMeters: 12,
        qrTokenHash,
      },
      {
        organisationId: organisation.id,
        userId: owner.id,
        locationId: DEV_LOCATION_ID,
        type: RcpEventType.CLOCK_OUT,
        happenedAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3, 14, 3, 0)),
        clientTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3, 14, 3, 0)),
        clientLat: 52.23223,
        clientLng: 20.98445,
        accuracyMeters: 25,
        distanceMeters: 10,
        qrTokenHash,
      },
    ],
  });

  console.log('seed:dev complete', {
    organisationId: organisation.id,
    ownerEmail: owner.email,
    employees: employees.length,
    shifts: shifts.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
