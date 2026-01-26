import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { Role, NotificationType, NotificationChannel } from '@prisma/client';

/**
 * E2E Test: Notification Campaign Flow
 *
 * Tests the complete flow:
 * 1. Manager creates a campaign with targeted audience
 * 2. Manager sends the campaign
 * 3. Employee receives notification in inbox
 * 4. Employee marks notification as read
 * 5. Unread count updates
 */
describe('NotificationCampaign (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organisationId: string;
  let managerUserId: string;
  let managerToken: string;
  let employeeUserId: string;
  let employeeToken: string;
  let employeeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test organization
    const org = await prisma.organisation.create({
      data: {
        id: 'test-org-e2e',
        name: 'Test Organization E2E',
        description: 'For E2E testing',
      },
    });
    organisationId = org.id;

    // Create manager user
    const managerPassword = 'TestPass123!';
    const managerPasswordHash = await bcrypt.hash(managerPassword, 10);
    const manager = await prisma.user.create({
      data: {
        email: 'manager-e2e@example.com',
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
        organisationId,
        firstName: 'Manager',
        lastName: 'Test',
      },
    });
    managerUserId = manager.id;

    // Create employee user and profile
    const employeePassword = 'TestPass123!';
    const employeePasswordHash = await bcrypt.hash(employeePassword, 10);
    const employee = await prisma.user.create({
      data: {
        email: 'employee-e2e@example.com',
        passwordHash: employeePasswordHash,
        role: Role.EMPLOYEE,
        organisationId,
        firstName: 'Employee',
        lastName: 'Test',
      },
    });
    employeeUserId = employee.id;

    const employeeProfile = await prisma.employee.create({
      data: {
        organisationId,
        userId: employeeUserId,
        firstName: 'Employee',
        lastName: 'Test',
        email: 'employee-e2e@example.com',
      },
    });
    employeeId = employeeProfile.id;

    // Login as manager
    const managerLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'manager-e2e@example.com',
        password: managerPassword,
      })
      .expect(200);
    managerToken = managerLoginRes.body.accessToken;

    // Login as employee
    const employeeLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'employee-e2e@example.com',
        password: employeePassword,
      })
      .expect(200);
    employeeToken = employeeLoginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.notificationRecipient.deleteMany({
      where: { campaign: { organisationId } },
    });
    await prisma.notificationCampaign.deleteMany({ where: { organisationId } });
    await prisma.notificationDeliveryAttempt.deleteMany({
      where: { notification: { organisationId } },
    });
    await prisma.notification.deleteMany({ where: { organisationId } });
    await prisma.employee.deleteMany({ where: { organisationId } });
    await prisma.user.deleteMany({ where: { organisationId } });
    await prisma.organisation.delete({ where: { id: organisationId } });

    await app.close();
  });

  it('should complete full campaign flow: create → send → receive → mark read', async () => {
    // Step 1: Manager creates a campaign targeting employees
    const createRes = await request(app.getHttpServer())
      .post('/notifications/campaigns')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'E2E Test Notification',
        body: 'This is an end-to-end test notification',
        type: NotificationType.CUSTOM,
        channels: [NotificationChannel.IN_APP],
        audienceFilter: {
          roles: [Role.EMPLOYEE],
        },
      })
      .expect(201);

    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.status).toBe('DRAFT');
    const campaignId = createRes.body.id;

    // Step 2: Manager sends the campaign
    const sendRes = await request(app.getHttpServer())
      .post(`/notifications/campaigns/${campaignId}/send`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(201);

    expect(sendRes.body.success).toBe(true);
    expect(sendRes.body.recipientCount).toBeGreaterThan(0);

    // Wait a bit for async processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Employee checks inbox and sees the notification
    const inboxRes = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(inboxRes.body.data).toBeInstanceOf(Array);
    expect(inboxRes.body.data.length).toBeGreaterThan(0);

    const notification = inboxRes.body.data.find(
      (n: any) => n.title === 'E2E Test Notification',
    );
    expect(notification).toBeDefined();
    expect(notification.readAt).toBeNull();
    expect(notification.type).toBe(NotificationType.CUSTOM);

    // Step 4: Check unread count
    const unreadCountRes = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(unreadCountRes.body.count).toBeGreaterThan(0);
    const initialUnreadCount = unreadCountRes.body.count;

    // Step 5: Employee marks notification as read
    const markReadRes = await request(app.getHttpServer())
      .patch(`/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(markReadRes.body.readAt).not.toBeNull();

    // Step 6: Verify unread count decreased
    const updatedUnreadCountRes = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(updatedUnreadCountRes.body.count).toBe(initialUnreadCount - 1);

    // Step 7: Manager checks campaign details
    const campaignDetailsRes = await request(app.getHttpServer())
      .get(`/notifications/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(campaignDetailsRes.body.status).toBe('SENT');
    expect(campaignDetailsRes.body.stats.total).toBeGreaterThan(0);
    expect(campaignDetailsRes.body.stats.deliveredInApp).toBeGreaterThan(0);
  });

  it('should enforce RBAC - employee cannot create campaigns', async () => {
    await request(app.getHttpServer())
      .post('/notifications/campaigns')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: 'Should Fail',
        body: 'Employee should not be able to create campaigns',
        type: NotificationType.CUSTOM,
        channels: [NotificationChannel.IN_APP],
        audienceFilter: { all: true },
      })
      .expect(403);
  });

  it('should enforce multi-tenancy - cannot access other org campaigns', async () => {
    // Create campaign in test org
    const createRes = await request(app.getHttpServer())
      .post('/notifications/campaigns')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Test Isolation',
        type: NotificationType.CUSTOM,
        channels: [NotificationChannel.IN_APP],
        audienceFilter: { all: true },
      })
      .expect(201);

    const campaignId = createRes.body.id;

    // Create another organization and user
    const otherOrg = await prisma.organisation.create({
      data: {
        name: 'Other Org',
        description: 'For isolation testing',
      },
    });

    const otherManagerPassword = 'TestPass123!';
    const otherManagerPasswordHash = await bcrypt.hash(
      otherManagerPassword,
      10,
    );
    const otherManager = await prisma.user.create({
      data: {
        email: 'other-manager@example.com',
        passwordHash: otherManagerPasswordHash,
        role: Role.MANAGER,
        organisationId: otherOrg.id,
        firstName: 'Other',
        lastName: 'Manager',
      },
    });

    // Login as other manager
    const otherLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'other-manager@example.com',
        password: otherManagerPassword,
      })
      .expect(200);
    const otherToken = otherLoginRes.body.accessToken;

    // Try to access campaign from different org
    await request(app.getHttpServer())
      .get(`/notifications/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    // Cleanup
    await prisma.user.delete({ where: { id: otherManager.id } });
    await prisma.organisation.delete({ where: { id: otherOrg.id } });
  });
});
