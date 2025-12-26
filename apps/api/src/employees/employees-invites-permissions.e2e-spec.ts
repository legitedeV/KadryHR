import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { MembershipRole, InviteStatus } from '@prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface InMemoryOrganization {
  id: string;
  name: string;
}

interface InMemoryMembership {
  id: string;
  userId: string;
  orgId: string;
  role: MembershipRole;
  organization: InMemoryOrganization;
}

interface InMemoryEmployee {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryInvite {
  id: string;
  orgId: string;
  email: string;
  role: MembershipRole;
  status: InviteStatus;
  token: string;
  resendCount: number;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryPrismaService {
  organizations: InMemoryOrganization[] = [];
  memberships: InMemoryMembership[] = [];
  employees: InMemoryEmployee[] = [];
  invites: InMemoryInvite[] = [];

  constructor() {
    const organization = { id: 'org-1', name: 'Test Org' };
    this.organizations.push(organization);
    this.memberships.push({
      id: 'm-1',
      orgId: organization.id,
      userId: 'user-1',
      role: MembershipRole.OWNER,
      organization,
    });
    this.memberships.push({
      id: 'm-2',
      orgId: organization.id,
      userId: 'user-2',
      role: MembershipRole.MANAGER,
      organization,
    });
  }

  membership = {
    findFirst: async ({ where }: any) => {
      const found = this.memberships.find(
        (m) =>
          (!where.id || m.id === where.id) &&
          (!where.userId || m.userId === where.userId) &&
          (!where.orgId || m.orgId === where.orgId),
      );
      return found ? { ...found } : null;
    },
    update: async ({ where, data }: any) => {
      const membership = this.memberships.find((m) => m.id === where.id);
      if (!membership) return null;
      Object.assign(membership, data);
      return { ...membership };
    },
  };

  employee = {
    findMany: async ({ where, orderBy }: any) => {
      let results = this.employees.filter((e) => e.orgId === where.orgId);

      if (where.active !== undefined) {
        results = results.filter((e) => e.active === where.active);
      }

      if (where.OR?.length) {
        results = results.filter((employee) =>
          where.OR.some((condition: any) => {
            if (condition.name) {
              return employee.name.toLowerCase().includes(condition.name.contains.toLowerCase());
            }
            if (condition.email && employee.email) {
              return employee.email.toLowerCase().includes(condition.email.contains.toLowerCase());
            }
            return false;
          }),
        );
      }

      if (orderBy?.createdAt === 'desc') {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return results.map((item) => ({ ...item }));
    },
    findFirst: async ({ where }: any) => {
      const found = this.employees.find((e) => e.id === where.id && e.orgId === where.orgId);
      return found ? { ...found } : null;
    },
    create: async ({ data }: any) => {
      const now = new Date();
      const employee: InMemoryEmployee = {
        id: data.id ?? randomUUID(),
        orgId: data.orgId,
        name: data.name,
        email: data.email,
        active: data.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.employees.push(employee);
      return { ...employee };
    },
    update: async ({ where, data }: any) => {
      const employee = this.employees.find((e) => e.id === where.id);
      if (!employee) return null;
      Object.assign(employee, data, { updatedAt: new Date() });
      return { ...employee };
    },
    count: async ({ where }: any) => {
      return this.employees.filter(
        (e) => e.orgId === where.orgId && (where.active === undefined || e.active === where.active),
      ).length;
    },
  };

  invite = {
    findMany: async ({ where, orderBy }: any) => {
      let results = this.invites.filter((invite) => invite.orgId === where.orgId);
      if (orderBy?.createdAt === 'desc') {
        results = [...results].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      return results.map((item) => ({ ...item }));
    },
    findFirst: async ({ where }: any) => {
      const found = this.invites.find(
        (invite) =>
          invite.orgId === where.orgId &&
          (where.id ? invite.id === where.id : true) &&
          (where.email ? invite.email === where.email : true) &&
          (where.status ? invite.status === where.status : true),
      );
      return found ? { ...found } : null;
    },
    create: async ({ data }: any) => {
      const now = new Date();
      const invite: InMemoryInvite = {
        id: data.id ?? randomUUID(),
        orgId: data.orgId,
        email: data.email,
        role: data.role,
        status: data.status ?? InviteStatus.PENDING,
        token: data.token,
        resendCount: data.resendCount ?? 0,
        lastSentAt: data.lastSentAt ?? now,
        createdAt: now,
        updatedAt: now,
      };
      this.invites.push(invite);
      return { ...invite };
    },
    update: async ({ where, data }: any) => {
      const invite = this.invites.find((item) => item.id === where.id);
      if (!invite) return null;
      Object.assign(invite, data, { updatedAt: new Date() });
      return { ...invite };
    },
  };
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-1', email: 'owner@example.com', orgId: 'org-1' };
    return true;
  }
}

describe('Employees, invites and permissions (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: InMemoryPrismaService;

  beforeAll(async () => {
    prisma = new InMemoryPrismaService();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('v2');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle employee CRUD and status counters', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/v2/employees')
      .set('x-org-id', 'org-1')
      .send({ name: 'Alice Example', email: 'alice@example.com' })
      .expect(201);

    expect(createResponse.body.name).toBe('Alice Example');
    expect(createResponse.body.active).toBe(true);

    const searchResponse = await request(app.getHttpServer())
      .get('/v2/employees')
      .set('x-org-id', 'org-1')
      .query({ search: 'Alice' })
      .expect(200);

    expect(searchResponse.body).toHaveLength(1);

    const employeeId = createResponse.body.id;

    const updateResponse = await request(app.getHttpServer())
      .put(`/v2/employees/${employeeId}`)
      .set('x-org-id', 'org-1')
      .send({ name: 'Alice Updated' })
      .expect(200);

    expect(updateResponse.body.name).toBe('Alice Updated');

    const deactivateResponse = await request(app.getHttpServer())
      .post(`/v2/employees/${employeeId}/deactivate`)
      .set('x-org-id', 'org-1')
      .expect(201);

    expect(deactivateResponse.body.active).toBe(false);

    const statusResponse = await request(app.getHttpServer())
      .get('/v2/employees/status')
      .set('x-org-id', 'org-1')
      .expect(200);

    expect(statusResponse.body).toMatchObject({ total: 1, active: 0, inactive: 1 });
  });

  it('should manage invites lifecycle', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/v2/invites')
      .set('x-org-id', 'org-1')
      .send({ email: 'manager@example.com', role: 'MANAGER' })
      .expect(201);

    expect(createResponse.body.status).toBe('PENDING');
    expect(createResponse.body.resendCount).toBe(0);

    const inviteId = createResponse.body.id;

    const resendResponse = await request(app.getHttpServer())
      .post(`/v2/invites/${inviteId}/resend`)
      .set('x-org-id', 'org-1')
      .expect(201);

    expect(resendResponse.body.resendCount).toBe(1);
    expect(new Date(resendResponse.body.lastSentAt).getTime()).toBeGreaterThan(0);

    const revokeResponse = await request(app.getHttpServer())
      .post(`/v2/invites/${inviteId}/revoke`)
      .set('x-org-id', 'org-1')
      .expect(201);

    expect(revokeResponse.body.status).toBe('REVOKED');
  });

  it('should expose permissions map and allow role updates', async () => {
    const permissionsResponse = await request(app.getHttpServer())
      .get('/v2/permissions')
      .set('x-org-id', 'org-1')
      .expect(200);

    expect(permissionsResponse.body.roles.OWNER).toBeDefined();
    expect(Array.isArray(permissionsResponse.body.definitions)).toBe(true);

    const updateResponse = await request(app.getHttpServer())
      .put('/v2/permissions/memberships/m-2')
      .set('x-org-id', 'org-1')
      .send({ role: 'ADMIN' })
      .expect(200);

    expect(updateResponse.body.role).toBe('ADMIN');
  });
});
