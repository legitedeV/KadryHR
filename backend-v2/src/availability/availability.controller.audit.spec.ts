import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('AvailabilityController audit logging (integration)', () => {
  let app: INestApplication;
  let auditService: { log: jest.Mock };
  let availabilityService: { saveWindowAvailabilityForEmployee: jest.Mock };

  beforeEach(async () => {
    auditService = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    availabilityService = {
      saveWindowAvailabilityForEmployee: jest.fn().mockResolvedValue({
        employeeId: 'emp-1',
        status: 'SUBMITTED',
        availability: [],
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        AuditLogInterceptor,
        { provide: AvailabilityService, useValue: availabilityService },
        { provide: AuditService, useValue: auditService },
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
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs audit entry when submitting availability window', async () => {
    await request(app.getHttpServer())
      .put('/availability/windows/window-1/me')
      .send({
        availabilities: [
          { date: '2024-04-01', startMinutes: 480, endMinutes: 960 },
        ],
        submit: true,
      })
      .expect(200);

    expect(availabilityService.saveWindowAvailabilityForEmployee).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'window-1',
      expect.any(Array),
      true,
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'AVAILABILITY_WINDOW_SUBMISSION',
        entityType: 'availability_submission',
      }),
    );
  });
});
