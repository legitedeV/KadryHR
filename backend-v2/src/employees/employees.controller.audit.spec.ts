import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { InvitationsService } from '../auth/invitations.service';

describe('EmployeesController audit logging (integration)', () => {
  let app: INestApplication;
  let auditService: { log: jest.Mock };
  let employeesService: { create: jest.Mock; deactivate: jest.Mock; activate: jest.Mock };

  beforeEach(async () => {
    auditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    employeesService = {
      create: jest.fn().mockResolvedValue({ id: 'emp-1', firstName: 'Jan' }),
      deactivate: jest.fn().mockResolvedValue({ id: 'emp-1', isActive: false }),
      activate: jest.fn().mockResolvedValue({ id: 'emp-1', isActive: true }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        AuditLogInterceptor,
        { provide: EmployeesService, useValue: employeesService },
        { provide: AuditService, useValue: auditService },
        {
          provide: InvitationsService,
          useValue: { issueInvitation: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            employee: { findFirst: jest.fn() },
            shift: { findFirst: jest.fn() },
            availability: { findFirst: jest.fn() },
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'user-1',
            organisationId: 'org-1',
            email: 'owner@example.com',
            role: Role.OWNER,
            permissions: [],
          };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs audit entry when creating an employee', async () => {
    await request(app.getHttpServer())
      .post('/employees')
      .send({ firstName: 'Jan', lastName: 'Kowalski' })
      .expect(201);

    expect(employeesService.create).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ firstName: 'Jan' }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'EMPLOYEE_CREATE',
        entityType: 'employee',
      }),
    );
  });

  it('logs audit entry when deactivating an employee', async () => {
    await request(app.getHttpServer())
      .patch('/employees/emp-1/deactivate')
      .expect(200);

    expect(employeesService.deactivate).toHaveBeenCalledWith('org-1', 'emp-1');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'EMPLOYEE_DEACTIVATE',
        entityType: 'employee',
      }),
    );
  });

  it('logs audit entry when activating an employee', async () => {
    await request(app.getHttpServer())
      .patch('/employees/emp-1/activate')
      .expect(200);

    expect(employeesService.activate).toHaveBeenCalledWith('org-1', 'emp-1');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'EMPLOYEE_ACTIVATE',
        entityType: 'employee',
      }),
    );
  });
});
