import { LeadsService } from './leads.service';
import { LeadStatus } from '@prisma/client';

const mockConfig = {
  get: jest.fn(),
} as any;

describe('LeadsService', () => {
  let service: LeadsService;
  const prisma = {
    lead: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    leadAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;
  const queueService = {
    addNewsletterEmailJob: jest.fn(),
  } as any;
  const emailAdapter = {
    sendEmail: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    mockConfig.get = jest.fn((key: string) => {
      const map: Record<string, any> = {
        'leads.defaultOrganisationId': 'org-1',
        'leads.notificationEmail': 'sales@kadryhr.pl',
        'leads.autoReplyEnabled': true,
        'leads.ipHashSalt': 'salt',
      };
      return map[key];
    });
    queueService.addNewsletterEmailJob = jest.fn().mockResolvedValue(true);
    prisma.lead.count = jest.fn().mockResolvedValue(0);
    prisma.lead.create = jest.fn().mockResolvedValue({
      id: 'lead-1',
      email: 'demo@company.pl',
      name: 'Anna Nowak',
      company: 'Sklep Demo',
      headcount: 42,
      message: 'Test',
      consentMarketing: true,
      consentPrivacy: true,
    });
    prisma.leadAuditLog.create = jest.fn().mockResolvedValue({});
    emailAdapter.sendEmail = jest.fn().mockResolvedValue({ success: true });
    service = new LeadsService(prisma, queueService, mockConfig, emailAdapter);
  });

  it('creates lead and enqueues emails', async () => {
    const result = await service.createPublicLead(
      {
        name: 'Anna Nowak',
        email: 'demo@company.pl',
        company: 'Sklep Demo',
        headcount: 42,
        message: 'Test',
        consentMarketing: true,
        consentPrivacy: true,
      },
      { ip: '127.0.0.1', userAgent: 'jest' },
    );

    expect(result).toEqual({ success: true, id: 'lead-1' });
    expect(prisma.lead.create).toHaveBeenCalled();
    expect(queueService.addNewsletterEmailJob).toHaveBeenCalledTimes(2);
  });

  it('updates lead status for admin', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      organisationId: 'org-1',
      status: LeadStatus.NEW,
    });
    prisma.lead.update.mockResolvedValue({
      id: 'lead-1',
      status: LeadStatus.CONTACTED,
    });

    const result = await service.updateStatus(
      {
        id: 'user-1',
        organisationId: 'org-1',
        role: 'OWNER',
        email: 'owner@kadryhr.pl',
        permissions: [],
      } as any,
      'lead-1',
      LeadStatus.CONTACTED,
    );

    expect(result).toEqual({ id: 'lead-1', status: LeadStatus.CONTACTED });
    expect(prisma.leadAuditLog.create).toHaveBeenCalled();
  });

  it('lists lead audit logs for permitted user', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      id: 'lead-1',
      organisationId: 'org-1',
      status: LeadStatus.NEW,
    });
    prisma.leadAuditLog.findMany.mockResolvedValue([
      { id: 'audit-1', action: 'lead.created' },
    ]);

    const result = await service.listAudit(
      {
        id: 'user-1',
        organisationId: 'org-1',
        role: 'OWNER',
        email: 'owner@kadryhr.pl',
        permissions: [],
      } as any,
      'lead-1',
      {},
    );

    expect(result).toEqual([{ id: 'audit-1', action: 'lead.created' }]);
    expect(prisma.leadAuditLog.findMany).toHaveBeenCalled();
  });
});
