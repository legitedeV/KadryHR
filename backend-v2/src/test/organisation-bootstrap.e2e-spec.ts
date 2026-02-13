import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulePeriodType } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Organisation bootstrap defaults (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string | null = null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (organisationId) {
      await prisma.organisation.delete({ where: { id: organisationId } });
    }
    await app.close();
  });

  it('creates deterministic defaults after registration', async () => {
    const email = `bootstrap-${Date.now()}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        firstName: 'Bootstrap',
        lastName: 'Owner',
        organisationName: 'Bootstrap Org',
      })
      .expect(201);

    organisationId = response.body.user.organisation.id;

    const organisation = await prisma.organisation.findUniqueOrThrow({
      where: { id: organisationId },
    });

    const shiftPresets = await prisma.shiftPreset.findMany({
      where: { organisationId },
      orderBy: { sortOrder: 'asc' },
    });

    const leaveTypes = await prisma.leaveType.findMany({
      where: { organisationId },
      orderBy: { name: 'asc' },
    });

    expect(organisation.schedulePeriod).toBe(SchedulePeriodType.MONTHLY);
    expect(organisation.enabledModules).toMatchObject({
      grafik: true,
      dyspozycje: true,
      rcp: true,
      urlopy: true,
      raporty: true,
    });
    expect(organisation.requireScheduleValidationBeforePublish).toBe(true);

    expect(shiftPresets.map((preset) => preset.name)).toEqual([
      'Rano',
      'Popołudnie',
      'Noc',
      'Międzyzmiana',
    ]);

    expect(leaveTypes.map((leaveType) => leaveType.name)).toEqual([
      'Bezpłatny',
      'L4',
      'Urlop na żądanie',
      'Urlop wypoczynkowy',
    ]);
  });
});
