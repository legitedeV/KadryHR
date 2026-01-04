import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { Role, InvitationStatus } from '@prisma/client';

describe('Employee Invitations (e2e)', () => {
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
        id: 'invite-org',
        name: 'Invite Org',
      },
    });
    organisationId = org.id;

    const managerPassword = 'TestPass123!';
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    await prisma.user.create({
      data: {
        id: 'invite-manager',
        email: 'invite-manager@example.com',
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'Tester',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'invite-manager@example.com', password: managerPassword })
      .expect(200);

    managerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.employeeInvitation.deleteMany({
      where: { employee: { organisationId } },
    });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('creates employee and issues invitation', async () => {
    const res = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        firstName: 'Nowy',
        lastName: 'Pracownik',
        email: 'nowy@example.com',
      })
      .expect(201);

    expect(res.body.invitationSent).toBe(true);
    employeeId = res.body.employee.id;

    const invitation = await prisma.employeeInvitation.findFirst({
      where: { employeeId },
    });
    expect(invitation?.status).toBe(InvitationStatus.PENDING);
  });

  it('resends invitation for pending employee', async () => {
    const firstInvite = await prisma.employeeInvitation.findFirst({
      where: { employeeId },
    });

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/resend-invitation`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    const pending = await prisma.employeeInvitation.findMany({
      where: { employeeId },
    });
    expect(pending.length).toBeGreaterThanOrEqual(1);
    const revoked = pending.find(
      (i) => i.status === InvitationStatus.REVOKED && i.id === firstInvite?.id,
    );
    expect(revoked).toBeTruthy();
    const latestPending = pending.find(
      (i) => i.status === InvitationStatus.PENDING,
    );
    expect(latestPending).toBeTruthy();
  });

  it('returns 400 when invitation already accepted', async () => {
    await prisma.employeeInvitation.updateMany({
      where: { employeeId },
      data: { status: InvitationStatus.ACCEPTED },
    });

    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/resend-invitation`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(400);

    expect(response.body.message).toBeDefined();
  });
});
