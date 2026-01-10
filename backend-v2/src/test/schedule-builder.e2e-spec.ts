import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Schedule Builder (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let managerToken: string;
  let employeeId: string;
  let locationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const org = await prisma.organisation.create({
      data: { id: 'schedule-org', name: 'Schedule Org' },
    });
    organisationId = org.id;

    const managerPassword = 'TestPass123!';
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    await prisma.user.create({
      data: {
        id: 'schedule-manager',
        email: 'schedule-manager@example.com',
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'Scheduler',
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: 'schedule-employee',
        organisationId,
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna@example.com',
      },
    });
    employeeId = employee.id;

    const location = await prisma.location.create({
      data: {
        id: 'schedule-location',
        organisationId,
        name: 'Salon Główny',
      },
    });
    locationId = location.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'schedule-manager@example.com',
        password: managerPassword,
      })
      .expect(200);

    managerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.scheduleTemplateShift.deleteMany({
      where: { template: { organisationId } },
    });
    await prisma.scheduleTemplate.deleteMany({
      where: { organisationId },
    });
    await prisma.shift.deleteMany({ where: { organisationId } });
    await prisma.location.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('creates template, copies previous week, and clears week', async () => {
    await request(app.getHttpServer())
      .post('/shifts')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        locationId,
        startsAt: '2024-01-02T08:00:00.000Z',
        endsAt: '2024-01-02T12:00:00.000Z',
        position: 'Barista',
      })
      .expect(201);

    const templateRes = await request(app.getHttpServer())
      .post('/schedule-templates/from-week')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Tydzień 1',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-07T23:59:59.000Z',
      })
      .expect(201);

    const templateId = templateRes.body.id as string;

    const templateDetail = await request(app.getHttpServer())
      .get(`/schedule-templates/${templateId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(templateDetail.body.shifts.length).toBe(1);

    const copyRes = await request(app.getHttpServer())
      .post('/shifts/copy-previous-week')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        from: '2024-01-08T00:00:00.000Z',
        to: '2024-01-14T23:59:59.000Z',
      })
      .expect(201);

    expect(copyRes.body.length).toBe(1);
    expect(copyRes.body[0].startsAt).toContain('2024-01-09');

    await request(app.getHttpServer())
      .post('/shifts')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(copyRes.body[0])
      .expect(201);

    const clearRes = await request(app.getHttpServer())
      .post('/shifts/clear-week')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        from: '2024-01-08T00:00:00.000Z',
        to: '2024-01-14T23:59:59.000Z',
      })
      .expect(201);

    expect(clearRes.body.deletedCount).toBeGreaterThanOrEqual(1);
  });
});
