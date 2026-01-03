import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('persists audit entry with tenant and actor', async () => {
    const prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    const service = new AuditService(prisma as any);

    const payload = {
      organisationId: 'org-1',
      actorUserId: 'user-1',
      action: 'EMPLOYEE_CREATE',
      entityType: 'employee',
      entityId: 'emp-1',
      before: { name: 'old' },
      after: { name: 'new' },
      ip: '127.0.0.1',
      userAgent: 'jest',
    };

    const result = await service.log(payload);

    expect(result).toEqual({ id: 'audit-1' });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'EMPLOYEE_CREATE',
        entityType: 'employee',
        entityId: 'emp-1',
        before: payload.before,
        after: payload.after,
        ip: '127.0.0.1',
        userAgent: 'jest',
      }),
    });
  });

  it('skips logging when tenant or actor missing', async () => {
    const prisma = { auditLog: { create: jest.fn() } };
    const service = new AuditService(prisma as any);

    await service.log({
      organisationId: '',
      actorUserId: '',
      action: 'TEST',
      entityType: 'employee',
    });

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
