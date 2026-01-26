import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Users Directory (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let ownerToken: string;
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
        id: 'users-org',
        name: 'Users Org',
      },
    });
    organisationId = org.id;

    const ownerPassword = 'OwnerPass123!';
    const managerPassword = 'ManagerPass123!';
    const ownerHash = await bcrypt.hash(ownerPassword, 10);
    const managerHash = await bcrypt.hash(managerPassword, 10);

    await prisma.user.create({
      data: {
        id: 'owner-user',
        email: 'owner-users@example.com',
        passwordHash: ownerHash,
        role: Role.OWNER,
        organisationId,
        firstName: 'Owner',
        lastName: 'User',
      },
    });

    await prisma.user.create({
      data: {
        id: 'manager-user',
        email: 'manager-users@example.com',
        passwordHash: managerHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'User',
      },
    });

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner-users@example.com', password: ownerPassword })
      .expect(200);

    ownerToken = ownerLogin.body.accessToken;

    const managerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manager-users@example.com', password: managerPassword })
      .expect(200);

    managerToken = managerLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.notificationDeliveryAttempt.deleteMany({
      where: { notification: { organisationId } },
    });
    await prisma.notification.deleteMany({ where: { organisationId } });
    await prisma.auditLog.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });
    await app.close();
  });

  it('allows owner to create user and list directory', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'new-user@example.com',
        password: 'StrongPass123!',
        role: 'EMPLOYEE',
        firstName: 'Nowy',
        lastName: 'Uzytkownik',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const emails = listRes.body.map((entry: { email: string }) => entry.email);
    expect(emails).toContain('new-user@example.com');
  });

  it('blocks non-owner from listing users', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });
});
