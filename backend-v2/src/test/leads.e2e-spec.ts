import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Public Leads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    await prisma.leadAuditLog.deleteMany({
      where: { lead: { email: 'e2e-lead@kadryhr.pl' } },
    });
    await prisma.lead.deleteMany({
      where: { email: 'e2e-lead@kadryhr.pl' },
    });
    await app.close();
  });

  it('accepts a public lead submission', async () => {
    const response = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        name: 'E2E Lead',
        email: 'e2e-lead@kadryhr.pl',
        company: 'KadryHR Demo',
        headcount: 28,
        message: 'Proszę o demo.',
        consentMarketing: true,
        consentPrivacy: true,
      })
      .expect(201);

    expect(response.body.success).toBe(true);

    const lead = await prisma.lead.findFirst({
      where: { email: 'e2e-lead@kadryhr.pl' },
    });

    expect(lead?.company).toBe('KadryHR Demo');
  });
});
