import { InvitationsService } from './invitations.service';
import { InvitationStatus, Role } from '@prisma/client';

const buildPrismaMock = () => {
  const prisma: any = {
    employee: { findFirst: jest.fn(), update: jest.fn() },
    employeeInvitation: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
  return prisma;
};

describe('InvitationsService.issueInvitation', () => {
  let prisma: any;
  let queueService: any;
  let service: InvitationsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    queueService = { addEmailDeliveryJob: jest.fn() } as any;
    service = new InvitationsService(
      prisma,
      queueService,
      { get: jest.fn() } as any,
      { login: jest.fn() } as any,
    );
  });

  it('creates a new invitation when eligible', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      organisationId: 'org-1',
      firstName: 'Jan',
      lastName: 'Nowak',
      email: 'emp@example.com',
      invitations: [],
      organisation: { id: 'org-1', name: 'Org' },
    });
    prisma.employeeInvitation.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'emp@example.com',
      organisationId: 'org-1',
      role: Role.EMPLOYEE,
    });
    queueService.addEmailDeliveryJob.mockResolvedValue(true);

    const result = await service.issueInvitation({
      organisationId: 'org-1',
      employeeId: 'emp-1',
      invitedEmail: 'emp@example.com',
      invitedByUserId: 'owner-1',
    });

    expect(result).toEqual({ success: true });
    expect(prisma.employeeInvitation.create).toHaveBeenCalled();
    expect(queueService.addEmailDeliveryJob).toHaveBeenCalled();
  });

  it('throws when invitation already accepted', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      organisationId: 'org-1',
      email: 'emp@example.com',
      invitations: [{ id: 'inv-1', status: InvitationStatus.ACCEPTED }],
      organisation: { id: 'org-1', name: 'Org' },
    });

    await expect(
      service.issueInvitation({
        organisationId: 'org-1',
        employeeId: 'emp-1',
        invitedEmail: 'emp@example.com',
        invitedByUserId: 'owner-1',
      }),
    ).rejects.toThrow('Pracownik ma już aktywne konto');
  });

  it('throttles when recent pending invitation exists', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      organisationId: 'org-1',
      email: 'emp@example.com',
      invitations: [],
      organisation: { id: 'org-1', name: 'Org' },
    });
    prisma.employeeInvitation.findFirst.mockResolvedValue({ id: 'inv-1' });

    await expect(
      service.issueInvitation({
        organisationId: 'org-1',
        employeeId: 'emp-1',
        invitedEmail: 'emp@example.com',
        invitedByUserId: 'owner-1',
      }),
    ).rejects.toThrow('Zaproszenie zostało już wysłane w ciągu ostatnich 10 minut');
  });
});
