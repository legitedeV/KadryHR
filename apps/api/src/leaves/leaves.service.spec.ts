import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { LeavesService } from './leaves.service';

class InMemoryPrismaService {
  employees = [{ id: 'emp-1', orgId: 'org-1', name: 'Jan Test', createdAt: new Date(), updatedAt: new Date(), active: true }];
  leaveRequests: any[] = [];

  employee = {
    findFirst: async ({ where }: any) =>
      this.employees.find((e) => e.id === where.id && e.orgId === where.orgId) || null,
  };

  leaveRequest = {
    findMany: async ({ where, orderBy, include }: any) => {
      let results = this.leaveRequests.filter((item) => item.orgId === where.orgId);

      if (where.status) {
        results = results.filter((item) => item.status === where.status || where.status?.in?.includes(item.status));
      }

      if (where.type) {
        results = results.filter((item) => item.type === where.type);
      }

      if (where.employeeId) {
        results = results.filter((item) => item.employeeId === where.employeeId);
      }

      if (where.startDate?.gte) {
        results = results.filter((item) => item.startDate >= new Date(where.startDate.gte));
      }

      if (where.startDate?.lte) {
        results = results.filter((item) => item.startDate <= new Date(where.startDate.lte));
      }

      if (where.OR?.length) {
        results = results.filter((item) => {
          const employee = item.employee || this.employees.find((emp) => emp.id === item.employeeId);
          return where.OR.some((condition: any) => {
            if (condition.employee?.name?.contains) {
              return employee?.name
                ?.toLowerCase()
                .includes(condition.employee.name.contains.toLowerCase());
            }
            if (condition.reason?.contains) {
              return item.reason?.toLowerCase().includes(condition.reason.contains.toLowerCase());
            }
            return false;
          });
        });
      }

      if (orderBy?.createdAt === 'desc') {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (orderBy?.startDate === 'asc') {
        results.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      }

      if (include?.employee) {
        return results.map((item) => ({ ...item, employee: this.employees.find((e) => e.id === item.employeeId) }));
      }

      return results;
    },
    findFirst: async ({ where, include }: any) => {
      const found = this.leaveRequests.find((item) => item.id === where.id && item.orgId === where.orgId);
      if (!found) return null;
      return include?.employee
        ? { ...found, employee: this.employees.find((e) => e.id === found.employeeId) }
        : { ...found };
    },
    create: async ({ data, include }: any) => {
      const entity = {
        ...data,
        id: `leave-${this.leaveRequests.length + 1}`,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.leaveRequests.push(entity);
      return include?.employee
        ? { ...entity, employee: this.employees.find((e) => e.id === entity.employeeId) }
        : { ...entity };
    },
    update: async ({ where, data, include }: any) => {
      const idx = this.leaveRequests.findIndex((item) => item.id === where.id);
      if (idx === -1) throw new NotFoundException();
      const existing = this.leaveRequests[idx];
      const next = { ...existing, ...data, updatedAt: new Date() };
      this.leaveRequests[idx] = next;
      return include?.employee
        ? { ...next, employee: this.employees.find((e) => e.id === next.employeeId) }
        : { ...next };
    },
    delete: async ({ where }: any) => {
      this.leaveRequests = this.leaveRequests.filter((item) => item.id !== where.id);
      return true;
    },
  };
}

describe('LeavesService', () => {
  let service: LeavesService;
  let prisma: InMemoryPrismaService;

  beforeEach(() => {
    prisma = new InMemoryPrismaService();
    service = new LeavesService(prisma as any);
  });

  it('creates a leave request with pending status', async () => {
    const result = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.ANNUAL,
      startDate: '2025-01-10',
      endDate: '2025-01-12',
      reason: 'Family trip',
    });

    expect(result.status).toBe(LeaveStatus.PENDING);
    expect(result.employee?.name).toBe('Jan Test');
    expect(prisma.leaveRequests).toHaveLength(1);
  });

  it('prevents creating leaves for other org employees', async () => {
    await expect(
      service.create('org-2', {
        employeeId: 'emp-1',
        type: LeaveType.ANNUAL,
        startDate: '2025-02-01',
        endDate: '2025-02-02',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates a pending request and rejects updates for decided ones', async () => {
    const created = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.ON_DEMAND,
      startDate: '2025-03-01',
      endDate: '2025-03-02',
    });

    const updated = await service.update('org-1', created.id, { reason: 'Updated' });
    expect(updated.reason).toBe('Updated');

    await service.approve('org-1', created.id, {});
    await expect(service.update('org-1', created.id, { reason: 'Nope' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions status via workflow endpoints', async () => {
    const created = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.UNPAID,
      startDate: '2025-04-10',
      endDate: '2025-04-12',
    });

    const approved = await service.approve('org-1', created.id, { note: 'ok' }, 'manager-1');
    expect(approved.status).toBe(LeaveStatus.APPROVED);
    expect(approved.decisionNote).toBe('ok');
    expect(approved.decidedById).toBe('manager-1');
  });

  it('prevents status transitions once a request is decided', async () => {
    const created = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.SICK,
      startDate: '2025-04-15',
      endDate: '2025-04-16',
    });

    await service.reject('org-1', created.id, { note: 'not enough balance' });

    await expect(service.approve('org-1', created.id, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes pending requests and blocks removal of decided ones', async () => {
    const created = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.ANNUAL,
      startDate: '2025-04-20',
      endDate: '2025-04-21',
    });

    await service.remove('org-1', created.id);
    expect(prisma.leaveRequests).toHaveLength(0);

    const decided = await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.ANNUAL,
      startDate: '2025-04-22',
      endDate: '2025-04-23',
    });

    await service.approve('org-1', decided.id, {});

    await expect(service.remove('org-1', decided.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists leaves with filters', async () => {
    await service.create('org-1', {
      employeeId: 'emp-1',
      type: LeaveType.SICK,
      startDate: '2025-05-01',
      endDate: '2025-05-02',
      reason: 'flu',
    });

    const results = await service.list('org-1', { type: LeaveType.SICK, search: 'jan' });
    expect(results).toHaveLength(1);
    expect(results[0].employee?.name).toBe('Jan Test');
  });

  it('rejects invalid ranges', async () => {
    await expect(
      service.create('org-1', {
        employeeId: 'emp-1',
        type: LeaveType.SICK,
        startDate: '2025-06-10',
        endDate: '2025-06-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
