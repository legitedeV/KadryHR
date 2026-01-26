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

describe('EmployeesController permissions (integration)', () => {
  let app: INestApplication;
  let employeesService: { create: jest.Mock };

  beforeEach(async () => {
    employeesService = {
      create: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        AuditLogInterceptor,
        PermissionsGuard,
        { provide: EmployeesService, useValue: employeesService },
        { provide: AuditService, useValue: { log: jest.fn() } },
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
            email: 'emp@example.com',
            role: Role.EMPLOYEE,
            permissions: [],
          };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects creation without required permission', async () => {
    await request(app.getHttpServer())
      .post('/employees')
      .send({ firstName: 'Jan', lastName: 'Kowalski' })
      .expect(403);

    expect(employeesService.create).not.toHaveBeenCalled();
  });
});
