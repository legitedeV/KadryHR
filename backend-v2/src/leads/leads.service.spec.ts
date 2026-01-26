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
    organisation: {
      findMany: jest.fn(),
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
  const emailTemplates = {
    leadAdminNotificationTemplate: jest.fn(),
    leadAutoReplyTemplate: jest.fn(),
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
    emailTemplates.leadAdminNotificationTemplate = jest.fn().mockReturnValue({
      subject: 'Nowy lead demo KadryHR',
      text: 'Lead admin',
      html: '<p>Lead admin</p>',
    });
    emailTemplates.leadAutoReplyTemplate = jest.fn().mockReturnValue({
      subject: 'KadryHR – potwierdzenie zgłoszenia demo',
      text: 'Auto reply',
      html: '<p>Auto reply</p>',
    });
    service = new LeadsService(
      prisma,
      queueService,
      mockConfig,
      emailAdapter,
      emailTemplates,
    );
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

  it('falls back to single organisation when default is missing', async () => {
    mockConfig.get = jest.fn((key: string) => {
      const map: Record<string, any> = {
        'leads.defaultOrganisationId': '',
        'leads.notificationEmail': 'sales@kadryhr.pl',
        'leads.autoReplyEnabled': true,
        'leads.ipHashSalt': 'salt',
      };
      return map[key];
    });
    prisma.organisation.findMany.mockResolvedValue([{ id: 'org-fallback' }]);

    await service.createPublicLead(
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

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organisationId: 'org-fallback' }),
      }),
    );
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
