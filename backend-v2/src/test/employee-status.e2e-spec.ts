import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Employee status management (e2e)', () => {
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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const org = await prisma.organisation.create({
      data: {
        id: 'status-org',
        name: 'Status Org',
      },
    });
    organisationId = org.id;

    const managerPassword = 'TestPass123!';
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    await prisma.user.create({
      data: {
        id: 'status-manager',
        email: 'status-manager@example.com',
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'Status',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'status-manager@example.com', password: managerPassword })
      .expect(200);

    managerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.shift.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('deactivates and reactivates an employee', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ firstName: 'Jan', lastName: 'Kowalski' })
      .expect(201);

    employeeId = createRes.body.employee.id;

    const deactivateRes = await request(app.getHttpServer())
      .patch(`/employees/${employeeId}/deactivate`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(deactivateRes.body.isActive).toBe(false);

    const activateRes = await request(app.getHttpServer())
      .patch(`/employees/${employeeId}/activate`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(activateRes.body.isActive).toBe(true);
  });

  it('soft deletes employee when history exists', async () => {
    await prisma.shift.create({
      data: {
        organisationId,
        employeeId,
        startsAt: new Date('2024-01-01T08:00:00.000Z'),
        endsAt: new Date('2024-01-01T12:00:00.000Z'),
      },
    });

    const deleteRes = await request(app.getHttpServer())
      .delete(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(deleteRes.body.softDeleted).toBe(true);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    expect(employee?.isDeleted).toBe(true);
    expect(employee?.isActive).toBe(false);
  });
});
