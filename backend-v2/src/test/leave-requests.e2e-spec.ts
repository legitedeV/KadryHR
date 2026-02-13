import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Leave requests payload validation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let managerToken: string;
  let employeeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.leaveRequest.deleteMany({ where: { organisationId: 'leave-e2e-org' } });
    await prisma.employee.deleteMany({ where: { organisationId: 'leave-e2e-org' } });
    await prisma.user.deleteMany({ where: { organisationId: 'leave-e2e-org' } });
    await prisma.organisation.deleteMany({ where: { id: 'leave-e2e-org' } });

    const organisation = await prisma.organisation.create({
      data: {
        id: 'leave-e2e-org',
        name: 'Leave E2E Org',
      },
    });
    organisationId = organisation.id;

    const managerPassword = 'TestPass123!';
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    await prisma.user.create({
      data: {
        id: 'leave-e2e-manager',
        email: 'leave-e2e-manager@example.com',
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'Leave',
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: 'leave-e2e-employee',
        organisationId,
        firstName: 'Jan',
        lastName: 'Nowak',
        email: 'jan.nowak@example.com',
      },
    });
    employeeId = employee.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'leave-e2e-manager@example.com',
        password: managerPassword,
      })
      .expect(200);

    managerToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await prisma.leaveRequest.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.deleteMany({ where: { id: organisationId } });
    await app.close();
  });

  it('accepts single-day day off payload with startDate=endDate', async () => {
    const response = await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: 'OTHER',
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        reason: 'Dzień wolny',
      })
      .expect(201);

    expect(response.body.startDate).toContain('2026-02-10');
    expect(response.body.endDate).toContain('2026-02-10');
  });

  it('accepts range leave payload with startDate and endDate', async () => {
    const response = await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: 'OTHER',
        startDate: '2026-02-12',
        endDate: '2026-02-14',
        reason: 'Urlop planowany',
      })
      .expect(201);

    expect(response.body.startDate).toContain('2026-02-12');
    expect(response.body.endDate).toContain('2026-02-14');
  });

  it('rejects unexpected fields under strict validation', async () => {
    await request(app.getHttpServer())
      .post('/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        employeeId,
        type: 'OTHER',
        startDate: '2026-02-20',
        endDate: '2026-02-20',
        reason: 'Dzień wolny',
        unexpectedField: true,
      })
      .expect(400);
  });
});
