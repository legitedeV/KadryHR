import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { Role, AvailabilitySubmissionStatus } from '@prisma/client';

describe('Availability Window Submissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let windowId: string;
  let employeeToken: string;
  let employeeId: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const org = await prisma.organisation.create({
      data: {
        id: 'availability-org',
        name: 'Availability Org',
      },
    });
    organisationId = org.id;

    const password = 'TestPass123!';
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        id: 'availability-employee-user',
        email: 'employee-availability@example.com',
        passwordHash,
        role: Role.EMPLOYEE,
        organisationId,
        firstName: 'Anna',
        lastName: 'Nowak',
      },
    });

    await prisma.user.create({
      data: {
        id: 'availability-manager-user',
        email: 'manager-availability@example.com',
        passwordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Marek',
        lastName: 'Kowalski',
      },
    });

    const employee = await prisma.employee.create({
      data: {
        organisationId,
        userId: 'availability-employee-user',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'employee-availability@example.com',
      },
    });
    employeeId = employee.id;

    const window = await prisma.availabilityWindow.create({
      data: {
        organisationId,
        title: 'Kwiecień 2024',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-30'),
        deadline: new Date('2099-04-01'),
        isOpen: true,
      },
    });
    windowId = window.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'employee-availability@example.com', password })
      .expect(200);

    employeeToken = loginRes.body.accessToken;

    const managerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manager-availability@example.com', password })
      .expect(200);

    managerToken = managerLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.availabilitySubmission.deleteMany({
      where: { organisationId },
    });
    await prisma.availability.deleteMany({ where: { organisationId } });
    await prisma.availabilityWindow.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('submits monthly availability for active window', async () => {
    const response = await request(app.getHttpServer())
      .put(`/availability/windows/${windowId}/me`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        availabilities: [
          { date: '2024-04-02', startMinutes: 480, endMinutes: 960 },
        ],
        submit: true,
      })
      .expect(200);

    expect(response.body.status).toBe(AvailabilitySubmissionStatus.SUBMITTED);

    const submission = await prisma.availabilitySubmission.findFirst({
      where: { organisationId, windowId, employeeId },
    });
    expect(submission?.status).toBe(AvailabilitySubmissionStatus.SUBMITTED);
  });

  it('closes an active window and blocks new submissions', async () => {
    await request(app.getHttpServer())
      .patch(`/availability/windows/${windowId}/close`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/availability/windows/${windowId}/me`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        availabilities: [
          { date: '2024-04-05', startMinutes: 480, endMinutes: 960 },
        ],
        submit: true,
      })
      .expect(400);
  });
});
