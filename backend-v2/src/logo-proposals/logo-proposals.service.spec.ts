import { LogoProposalsService } from './logo-proposals.service';
import { LogoProposalStatus, LogoProposalVote, Role } from '@prisma/client';
import { Permission } from '../auth/permissions';

const prisma = {
  logoProposal: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  logoProposalFeedback: {
    upsert: jest.fn(),
  },
  organisation: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

const notificationsService = {
  createNotification: jest.fn(),
} as any;

const emailTemplates = {
  logoProposalReviewTemplate: jest.fn(),
  logoProposalApprovedTemplate: jest.fn(),
} as any;

const configService = {
  get: jest.fn(),
} as any;

describe('LogoProposalsService', () => {
  let service: LogoProposalsService;

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get = jest.fn((key: string) => {
      if (key === 'FRONTEND_BASE_URL') return 'https://app.kadryhr.pl';
      return null;
    });
    emailTemplates.logoProposalReviewTemplate.mockReturnValue({
      subject: 'review',
      html: '<p>review</p>',
    });
    emailTemplates.logoProposalApprovedTemplate.mockReturnValue({
      subject: 'approved',
      html: '<p>approved</p>',
    });

    service = new LogoProposalsService(
      prisma,
      notificationsService,
      emailTemplates,
      configService,
    );
  });

  it('limits list results for employees to submitted/approved', async () => {
    prisma.logoProposal.findMany.mockResolvedValue([]);
    prisma.logoProposal.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.list(
      {
        id: 'user-1',
        email: 'employee@kadryhr.pl',
        organisationId: 'org-1',
        role: Role.EMPLOYEE,
        permissions: [Permission.BRANDING_VIEW],
      },
      {},
    );

    expect(prisma.logoProposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: 'org-1',
          status: { in: [LogoProposalStatus.SUBMITTED, LogoProposalStatus.APPROVED] },
        }),
      }),
    );
  });

  it('creates feedback for submitted proposal', async () => {
    prisma.logoProposal.findFirst.mockResolvedValue({
      id: 'proposal-1',
      organisationId: 'org-1',
      status: LogoProposalStatus.SUBMITTED,
    });
    prisma.logoProposalFeedback.upsert.mockResolvedValue({
      id: 'feedback-1',
      vote: LogoProposalVote.APPROVE,
    });

    const result = await service.feedback(
      {
        id: 'user-1',
        email: 'employee@kadryhr.pl',
        organisationId: 'org-1',
        role: Role.EMPLOYEE,
      },
      'proposal-1',
      { vote: LogoProposalVote.APPROVE, comment: 'Świetnie' },
    );

    expect(result).toEqual({ id: 'feedback-1', vote: LogoProposalVote.APPROVE });
  });

  it('approves proposal and updates organisation logo', async () => {
    prisma.logoProposal.findFirst.mockResolvedValue({
      id: 'proposal-2',
      organisationId: 'org-1',
      status: LogoProposalStatus.SUBMITTED,
      title: 'Logo 2024',
      logoSvg: '<svg>ok</svg>',
    });
    prisma.logoProposal.update.mockResolvedValue({ id: 'proposal-2' });
    prisma.organisation.update.mockResolvedValue({ id: 'org-1' });
    prisma.$transaction.mockResolvedValue([{ id: 'proposal-2', title: 'Logo 2024' }]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.organisation.findUnique.mockResolvedValue({ name: 'Org' });

    const result = await service.approve(
      {
        id: 'user-1',
        email: 'owner@kadryhr.pl',
        organisationId: 'org-1',
        role: Role.OWNER,
      },
      'proposal-2',
      true,
    );

    expect(result).toEqual({ id: 'proposal-2', title: 'Logo 2024' });
    expect(prisma.organisation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          logoUrl: expect.stringContaining('data:image/svg+xml;base64,'),
        }),
      }),
    );
  });
});
