import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipRole, ScheduleStatus } from '@prisma/client';

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
  active: boolean;
}

interface InMemorySchedule {
  id: string;
  orgId: string;
  month: string;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryAssignment {
  id: string;
  scheduleId: string;
  employeeId: string;
  date: Date;
  start: string;
  end: string;
  type: string;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryPrismaService {
  organizations: InMemoryOrganization[] = [];
  memberships: InMemoryMembership[] = [];
  employees: InMemoryEmployee[] = [];
  schedules: InMemorySchedule[] = [];
  shiftAssignments: InMemoryAssignment[] = [];

  constructor() {
    const orgId = 'org-1';
    const organization = { id: orgId, name: 'Test Org' };

    this.organizations.push(organization);
    this.memberships.push({
      id: randomUUID(),
      orgId,
      userId: 'user-1',
      role: MembershipRole.OWNER,
      organization,
    });
  }

  membership = {
    findFirst: async ({ where }: any) => {
      const found = this.memberships.find(
        (m) => m.userId === where.userId && m.orgId === where.orgId,
      );

      if (!found) {
        return null;
      }

      return { ...found };
    },
  };

  employee = {
    findFirst: async ({ where }: any) => {
      return (
        this.employees.find(
          (e) => e.id === where.id && e.orgId === where.orgId && e.active !== false,
        ) || null
      );
    },
    create: async ({ data }: any) => {
      const employee: InMemoryEmployee = {
        id: data.id ?? randomUUID(),
        orgId: data.orgId,
        name: data.name,
        active: data.active ?? true,
      };

      this.employees.push(employee);
      return employee;
    },
  };

  schedule = {
    findFirst: async ({ where }: any) => {
      return (
        this.schedules.find((s) => s.orgId === where.orgId && s.month === where.month) || null
      );
    },
    create: async ({ data }: any) => {
      const schedule: InMemorySchedule = {
        id: data.id ?? randomUUID(),
        orgId: data.orgId,
        month: data.month,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.schedules.push(schedule);
      return schedule;
    },
    update: async ({ where, data }: any) => {
      const schedule = this.schedules.find((s) => s.id === where.id);

      if (!schedule) {
        return null;
      }

      Object.assign(schedule, data, { updatedAt: new Date() });
      return schedule;
    },
  };

  shiftAssignment = {
    findMany: async ({ where, orderBy }: any) => {
      const assignments = this.shiftAssignments.filter(
        (assignment) => assignment.scheduleId === where.scheduleId,
      );

      if (orderBy?.date === 'asc') {
        assignments.sort((a, b) => a.date.getTime() - b.date.getTime());
      }

      return assignments;
    },
    create: async ({ data }: any) => {
      const assignment: InMemoryAssignment = {
        id: data.id ?? randomUUID(),
        scheduleId: data.scheduleId,
        employeeId: data.employeeId,
        date: data.date,
        start: data.start,
        end: data.end,
        type: data.type,
        note: data.note ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.shiftAssignments.push(assignment);
      return assignment;
    },
    findUnique: async ({ where }: any) => {
      const assignment = this.shiftAssignments.find((item) => item.id === where.id);
      if (!assignment) {
        return null;
      }

      const schedule = this.schedules.find((s) => s.id === assignment.scheduleId);
      return schedule ? { ...assignment, schedule } : null;
    },
    update: async ({ where, data }: any) => {
      const assignment = this.shiftAssignments.find((item) => item.id === where.id);
      if (!assignment) {
        return null;
      }

      Object.assign(assignment, data, { updatedAt: new Date() });
      return assignment;
    },
    delete: async ({ where }: any) => {
      const index = this.shiftAssignments.findIndex((item) => item.id === where.id);

      if (index === -1) {
        return null;
      }

      const [removed] = this.shiftAssignments.splice(index, 1);
      return removed;
    },
  };
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-1', email: 'test@example.com', orgId: 'org-1' };
    return true;
  }
}

describe('Schedule module (e2e)', () => {
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

    await prisma.employee.create({
      data: { id: 'emp-1', orgId: 'org-1', name: 'John Doe', active: true },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle assignment CRUD within organization', async () => {
    const month = '2025-02';

    const scheduleResponse = await request(app.getHttpServer())
      .get(`/v2/schedules/${month}`)
      .set('x-org-id', 'org-1')
      .expect(200);

    expect(scheduleResponse.body.month).toBe(month);
    expect(scheduleResponse.body.status).toBe(ScheduleStatus.DRAFT);

    const createResponse = await request(app.getHttpServer())
      .post(`/v2/schedules/${month}/assignments`)
      .set('x-org-id', 'org-1')
      .send({
        employeeId: 'emp-1',
        date: '2025-02-05',
        start: '09:00',
        end: '17:00',
        type: 'WORK',
        note: 'First shift',
      })
      .expect(201);

    expect(createResponse.body.employeeId).toBe('emp-1');
    expect(createResponse.body.scheduleId).toBe(scheduleResponse.body.id);

    const assignmentId = createResponse.body.id;

    const updateResponse = await request(app.getHttpServer())
      .put(`/v2/assignments/${assignmentId}`)
      .set('x-org-id', 'org-1')
      .send({ start: '10:00', note: 'Updated note' })
      .expect(200);

    expect(updateResponse.body.start).toBe('10:00');
    expect(updateResponse.body.note).toBe('Updated note');

    await request(app.getHttpServer())
      .delete(`/v2/assignments/${assignmentId}`)
      .set('x-org-id', 'org-1')
      .expect(204);

    const listResponse = await request(app.getHttpServer())
      .get(`/v2/schedules/${month}/assignments`)
      .set('x-org-id', 'org-1')
      .expect(200);

    expect(listResponse.body.assignments).toHaveLength(0);
  });
});
