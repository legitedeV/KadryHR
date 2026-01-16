import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, Role } from '@prisma/client';

describe('Leads management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let leadId: string;
  const organisationId = 'leads-org';

  beforeAll(async () => {
    process.env.LEADS_DEFAULT_ORGANISATION_ID = organisationId;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    await prisma.organisation.create({
      data: {
        id: organisationId,
        name: 'Leads Org',
      },
    });

    const ownerPassword = 'OwnerPass123!';
    const ownerHash = await bcrypt.hash(ownerPassword, 10);

    await prisma.user.create({
      data: {
        id: 'leads-owner',
        email: 'owner-leads@example.com',
        passwordHash: ownerHash,
        role: Role.OWNER,
        organisationId,
        firstName: 'Owner',
        lastName: 'Leads',
      },
    });

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner-leads@example.com', password: ownerPassword })
      .expect(200);

    ownerToken = ownerLogin.body.accessToken;
  });

  afterAll(async () => {
    if (leadId) {
      await prisma.leadAuditLog.deleteMany({ where: { leadId } });
      await prisma.lead.delete({ where: { id: leadId } });
    }
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('creates, lists and updates demo leads for owners', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        name: 'Demo Lead',
        email: 'demo-lead@kadryhr.pl',
        company: 'KadryHR Demo',
        headcount: 12,
        message: 'Proszę o demo.',
        consentMarketing: true,
        consentPrivacy: true,
      })
      .expect(201);

    leadId = createResponse.body.id;

    const listResponse = await request(app.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(listResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: leadId, status: LeadStatus.NEW }),
      ]),
    );

    const updateResponse = await request(app.getHttpServer())
      .patch(`/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: LeadStatus.CONTACTED })
      .expect(200);

    expect(updateResponse.body.status).toBe(LeadStatus.CONTACTED);
  });
});
