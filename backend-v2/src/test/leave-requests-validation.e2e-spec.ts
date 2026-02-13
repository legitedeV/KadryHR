import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveCategory, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Leave requests validation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let employeeId: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const org = await prisma.organisation.create({
      data: {
        id: 'leave-validation-org',
        name: 'Leave Validation Org',
      },
    });
    organisationId = org.id;

    const password = 'TestPass123!';
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        id: 'leave-validation-manager',
        email: 'leave-validation-manager@example.com',
        passwordHash,
        role: Role.MANAGER,
        organisationId,
      },
    });

    await prisma.user.create({
      data: {
        id: 'leave-validation-employee-user',
        email: 'leave-validation-employee@example.com',
        passwordHash,
        role: Role.EMPLOYEE,
        organisationId,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        organisationId,
        userId: 'leave-validation-employee-user',
        firstName: 'Jan',
        lastName: 'Nowak',
        email: 'leave-validation-employee@example.com',
      },
    });
    employeeId = employee.id;

    const managerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'leave-validation-manager@example.com', password })
      .expect(200);
    managerToken = managerLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.leaveRequest.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('accepts single-day day off payload', async () => {
    await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: LeaveCategory.OTHER,
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        reason: 'Dzień wolny',
      })
      .expect(201);
  });

  it('accepts range leave payload', async () => {
    await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: LeaveCategory.OTHER,
        startDate: '2026-02-12',
        endDate: '2026-02-13',
        reason: 'Wolne',
      })
      .expect(201);
  });

  it('rejects unexpected fields with 400', async () => {
    await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: LeaveCategory.OTHER,
        startDate: '2026-02-15',
        endDate: '2026-02-15',
        reason: 'Dzień wolny',
        unexpectedField: 'not-allowed',
      })
      .expect(400);
  });
});
