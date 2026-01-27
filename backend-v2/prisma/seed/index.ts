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
        position: 'Kasjer',
      },
      {
        organisationId: organisation.id,
        firstName: 'Mia',
        lastName: 'Manager',
        email: 'mia.manager@seed.local',
        position: 'Sala',
      },
      {
        organisationId: organisation.id,
        firstName: 'Sofia',
        lastName: 'Support',
        email: 'sofia.support@seed.local',
        position: 'Kasjer',
      },
      {
        organisationId: organisation.id,
        firstName: 'Liam',
        lastName: 'Nowak',
        email: 'liam.nowak@seed.local',
        position: 'Sala',
      },
      {
        organisationId: organisation.id,
        firstName: 'Amelia',
        lastName: 'Kowalska',
        email: 'amelia.kowalska@seed.local',
        position: 'Kasjer',
      },
      {
        organisationId: organisation.id,
        firstName: 'Noah',
        lastName: 'Zielinski',
        email: 'noah.zielinski@seed.local',
        position: 'Sala',
      },
    ],
    skipDuplicates: true,
  });

  const employees = await prisma.employee.findMany({
    where: { organisationId: organisation.id },
    orderBy: { createdAt: 'asc' },
  });

  const [ethan, mia, sofia, liam, amelia, noah] = employees;

  // 4) LOCATIONS
  await prisma.location.createMany({
    data: [
      {
        organisationId: organisation.id,
        name: 'Sklep główny',
        address: 'ul. Marszałkowska 10, Warszawa',
      },
    ],
    skipDuplicates: true,
  });

  const [mainCafe] = await prisma.location.findMany({
    where: { organisationId: organisation.id },
    orderBy: { createdAt: 'asc' },
  });

  // 4.1) POSITIONS
  await prisma.position.createMany({
    data: [
      {
        organisationId: organisation.id,
        name: 'Kasjer',
      },
      {
        organisationId: organisation.id,
        name: 'Sala',
      },
    ],
    skipDuplicates: true,
  });

  const positions = await prisma.position.findMany({
    where: { organisationId: organisation.id },
    orderBy: { name: 'asc' },
  });

  const kasjer = positions.find((p) => p.name === 'Kasjer');
  const sala = positions.find((p) => p.name === 'Sala');

  if (!kasjer || !sala) {
    throw new Error('Positions not created during seed');
  }

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

  // 5) SCHEDULE PERIODS (1 tydzień + 1 miesiąc, DRAFT)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [weeklyPeriod, monthlyPeriod] = await Promise.all([
    prisma.schedulePeriod.create({
      data: {
        organisationId: organisation.id,
        locationId: mainCafe.id,
        from: startOfWeek,
        to: endOfWeek,
        status: 'DRAFT',
        version: 1,
      },
    }),
    prisma.schedulePeriod.create({
      data: {
        organisationId: organisation.id,
        locationId: mainCafe.id,
        from: startOfMonth,
        to: endOfMonth,
        status: 'DRAFT',
        version: 1,
      },
    }),
  ]);

  // 6) SHIFTS (przykładowe zmiany)
  await prisma.shift.createMany({
    data: [
      {
        organisationId: organisation.id,
        periodId: weeklyPeriod.id,
        employeeId: ethan.id,
        locationId: mainCafe.id,
        positionId: kasjer.id,
        position: 'Kasjer',
        note: 'Zmiana poranna',
        startsAt: new Date(startOfWeek.getTime() + 8 * 60 * 60 * 1000),
        endsAt: new Date(startOfWeek.getTime() + 14 * 60 * 60 * 1000),
        status: 'DRAFT',
        createdById: owner.id,
        updatedById: owner.id,
      },
      {
        organisationId: organisation.id,
        periodId: weeklyPeriod.id,
        employeeId: mia.id,
        locationId: mainCafe.id,
        positionId: sala.id,
        position: 'Sala',
        note: 'Zmiana popołudniowa',
        startsAt: new Date(startOfWeek.getTime() + 13 * 60 * 60 * 1000),
        endsAt: new Date(startOfWeek.getTime() + 20 * 60 * 60 * 1000),
        status: 'DRAFT',
        createdById: owner.id,
        updatedById: owner.id,
      },
      {
        organisationId: organisation.id,
        periodId: weeklyPeriod.id,
        employeeId: sofia.id,
        locationId: mainCafe.id,
        positionId: kasjer.id,
        position: 'Kasjer',
        note: 'Zmiana wieczorna',
        startsAt: new Date(startOfWeek.getTime() + 16 * 60 * 60 * 1000),
        endsAt: new Date(startOfWeek.getTime() + 22 * 60 * 60 * 1000),
        status: 'DRAFT',
        createdById: owner.id,
        updatedById: owner.id,
      },
    ],
    skipDuplicates: true,
  });

  // 7) SCHEDULE VALIDATIONS + AUDIT
  await prisma.scheduleValidation.createMany({
    data: [
      {
        organisationId: organisation.id,
        periodId: weeklyPeriod.id,
        employeeId: ethan.id,
        ruleCode: 'MIN_REST',
        severity: 'WARNING',
        message: 'Zbyt krótka przerwa pomiędzy zmianami.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.scheduleAudit.create({
    data: {
      organisationId: organisation.id,
      entityType: 'SchedulePeriod',
      entityId: weeklyPeriod.id,
      action: 'CREATED',
      afterJson: { status: 'DRAFT', version: 1 },
      actorId: owner.id,
    },
  });

  // 8) AUTO PLAN TEMPLATE
  const autoPlanTemplate = await prisma.autoPlanTemplate.create({
    data: {
      organisationId: organisation.id,
      name: 'Szablon tygodnia podstawowego',
      description: 'Bazowy szablon obsady na tydzień.',
      createdById: owner.id,
    },
  });

  await prisma.autoPlanTemplateBlock.createMany({
    data: [
      {
        organisationId: organisation.id,
        templateId: autoPlanTemplate.id,
        locationId: mainCafe.id,
        positionId: kasjer.id,
        weekday: Weekday.MONDAY,
        startMinutes: 8 * 60,
        endMinutes: 16 * 60,
        requiredCount: 1,
      },
      {
        organisationId: organisation.id,
        templateId: autoPlanTemplate.id,
        locationId: mainCafe.id,
        positionId: sala.id,
        weekday: Weekday.MONDAY,
        startMinutes: 12 * 60,
        endMinutes: 20 * 60,
        requiredCount: 1,
      },
    ],
    skipDuplicates: true,
  });

  // 9) AVAILABILITY (dyspozycyjność — baza pod panel wniosków)
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
