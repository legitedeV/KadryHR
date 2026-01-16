import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Logo Proposals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let ownerToken: string;
  let employeeToken: string;

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
        id: 'logo-org',
        name: 'Logo Org',
      },
    });
    organisationId = org.id;

    const ownerPassword = 'OwnerPass123!';
    const employeePassword = 'EmployeePass123!';
    const ownerHash = await bcrypt.hash(ownerPassword, 10);
    const employeeHash = await bcrypt.hash(employeePassword, 10);

    await prisma.user.create({
      data: {
        id: 'logo-owner',
        email: 'logo-owner@example.com',
        passwordHash: ownerHash,
        role: Role.OWNER,
        organisationId,
        firstName: 'Owner',
        lastName: 'Logo',
      },
    });

    await prisma.user.create({
      data: {
        id: 'logo-employee',
        email: 'logo-employee@example.com',
        passwordHash: employeeHash,
        role: Role.EMPLOYEE,
        organisationId,
        firstName: 'Employee',
        lastName: 'Logo',
      },
    });

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'logo-owner@example.com', password: ownerPassword })
      .expect(200);

    ownerToken = ownerLogin.body.accessToken;

    const employeeLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'logo-employee@example.com', password: employeePassword })
      .expect(200);

    employeeToken = employeeLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.notificationDeliveryAttempt.deleteMany({
      where: { notification: { organisationId } },
    });
    await prisma.notification.deleteMany({ where: { organisationId } });
    await prisma.logoProposalFeedback.deleteMany({ where: { organisationId } });
    await prisma.logoProposal.deleteMany({ where: { organisationId } });
    await prisma.auditLog.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('runs the logo proposal flow end-to-end', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/logo-proposals')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'KadryHR Aurora',
        description: 'Nowoczesny znak oparty o monogram.',
        primaryColor: '#22c55e',
        secondaryColor: '#0f172a',
        accentColor: '#38bdf8',
        typography: 'Sora',
        symbol: 'monogram',
        logoSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"></svg>',
        logoConfig: { layout: 'stacked' },
      })
      .expect(201);

    const proposalId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/logo-proposals/${proposalId}/submit`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/logo-proposals')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(listRes.body.data.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/logo-proposals/${proposalId}/feedback`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ vote: 'APPROVE', comment: 'Spójne i nowoczesne.' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/logo-proposals/${proposalId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ applyToOrganisation: true })
      .expect(201);

    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    expect(organisation?.logoUrl).toContain('data:image/svg+xml;base64');
  });
});
