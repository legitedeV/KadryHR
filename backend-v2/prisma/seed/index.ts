import {
  LeaveStatus,
  LeaveCategory,
  PrismaClient,
  Role,
  Weekday,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

/**
 * Seed korzysta z tego samego mechanizmu połączenia co aplikacja:
 * Prisma 7 + adapter PrismaPg + DATABASE_URL z .env
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required to run the seed. Ustaw ją w backend-v2/.env'
  );
}

// POPRAWNE użycie PrismaPg – przekazujemy obiekt z connectionString,
// a nie sam string (inaczej dostajesz błąd z "in" operator / password).
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const seedPassword = 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // 1) ORGANISATION
  const organisation = await prisma.organisation.upsert({
    where: { id: 'seed-organisation' },
    update: {},
    create: {
      id: 'seed-organisation',
      name: 'Seed Organisation',
      description: 'Demo organisation for development and testing.',
      preventShiftOnApprovedLeave: true,
    },
  });

  // 2) OWNER USER
  await prisma.user.upsert({
    where: { email: 'owner@seed.local' },
    update: {},
    create: {
      email: 'owner@seed.local',
      passwordHash,
      role: Role.OWNER,
      organisationId: organisation.id,
      firstName: 'Olivia',
      lastName: 'Owner',
    },
  });

  const owner = await prisma.user.findFirst({
    where: { email: 'owner@seed.local' },
  });

  if (!owner) {
    throw new Error('Owner user not created during seed');
  }

  // 3) EMPLOYEES
  await prisma.employee.createMany({
    data: [
      {
        organisationId: organisation.id,
        firstName: 'Ethan',
        lastName: 'Employee',
        email: 'ethan.employee@seed.local',
        position: 'Barista',
      },
      {
        organisationId: organisation.id,
        firstName: 'Mia',
        lastName: 'Manager',
        email: 'mia.manager@seed.local',
        position: 'Shift Manager',
      },
      {
        organisationId: organisation.id,
        firstName: 'Sofia',
        lastName: 'Support',
        email: 'sofia.support@seed.local',
        position: 'Support Staff',
      },
    ],
    skipDuplicates: true,
  });

  const employees = await prisma.employee.findMany({
    where: { organisationId: organisation.id },
    orderBy: { createdAt: 'asc' },
  });

  const [ethan, mia, sofia] = employees;

  // 4) LOCATIONS
  await prisma.location.createMany({
    data: [
      {
        organisationId: organisation.id,
        name: 'Main Cafe',
        address: '123 Coffee St, Warszawa',
      },
      {
        organisationId: organisation.id,
        name: 'Warehouse',
        address: '456 Supply Ave, Warszawa',
      },
    ],
    skipDuplicates: true,
  });

  const [mainCafe] = await prisma.location.findMany({
    where: { organisationId: organisation.id },
    orderBy: { createdAt: 'asc' },
  });

  // 5) LEAVE TYPES
  await prisma.leaveType.createMany({
    data: [
      {
        organisationId: organisation.id,
        name: 'Urlop wypoczynkowy',
        code: LeaveCategory.PAID_LEAVE,
        isPaid: true,
        color: '#22c55e',
      },
      {
        organisationId: organisation.id,
        name: 'Chorobowe',
        code: LeaveCategory.SICK,
        isPaid: true,
        color: '#0ea5e9',
      },
      {
        organisationId: organisation.id,
        name: 'Urlop bezpłatny',
        code: LeaveCategory.UNPAID,
        isPaid: false,
        color: '#f97316',
      },
    ],
    skipDuplicates: true,
  });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { organisationId: organisation.id },
  });

  // 5) SHIFTS (przykładowe zmiany)
  await prisma.shift.createMany({
    data: [
      {
        organisationId: organisation.id,
        employeeId: ethan.id,
        locationId: mainCafe.id,
        position: 'Morning Barista',
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      },
      {
        organisationId: organisation.id,
        employeeId: mia.id,
        locationId: mainCafe.id,
        position: 'Shift Lead',
        startsAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
      {
        organisationId: organisation.id,
        employeeId: sofia.id,
        locationId: mainCafe.id,
        position: 'Support',
        startsAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 14 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // 6) AVAILABILITY (dyspozycyjność — baza pod panel wniosków)
  await prisma.availability.createMany({
    data: [
      {
        organisationId: organisation.id,
        employeeId: ethan.id,
        weekday: Weekday.MONDAY,
        startMinutes: 8 * 60,
        endMinutes: 16 * 60,
      },
      {
        organisationId: organisation.id,
        employeeId: mia.id,
        weekday: Weekday.FRIDAY,
        startMinutes: 10 * 60,
        endMinutes: 18 * 60,
      },
      {
        organisationId: organisation.id,
        employeeId: sofia.id,
        weekday: Weekday.WEDNESDAY,
        startMinutes: 12 * 60,
        endMinutes: 20 * 60,
      },
    ],
    skipDuplicates: true,
  });

  // 7) LEAVE REQUESTS (nowe workflow urlopowe)
  await prisma.leaveRequest.createMany({
    data: [
      {
        organisationId: organisation.id,
        employeeId: ethan.id,
        createdByUserId: owner.id,
        type: LeaveCategory.PAID_LEAVE,
        leaveTypeId:
          leaveTypes.find((lt) => lt.code === LeaveCategory.PAID_LEAVE)?.id ??
          null,
        status: LeaveStatus.PENDING,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        reason: 'Planowany urlop wypoczynkowy',
      },
      {
        organisationId: organisation.id,
        employeeId: mia.id,
        createdByUserId: owner.id,
        type: LeaveCategory.SICK,
        leaveTypeId:
          leaveTypes.find((lt) => lt.code === LeaveCategory.SICK)?.id ?? null,
        status: LeaveStatus.APPROVED,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        reason: 'Zwolnienie lekarskie',
        decisionAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log(
    'Seed completed. Owner credentials: owner@seed.local /',
    seedPassword,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
