import { Test } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { InvitationStatus, Role } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  employee: { findFirst: jest.fn() },
  employeeInvitation: { findFirst: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
  employeeInvitationCreateData: null,
  $transaction: jest.fn(),
};

const queueMock = { addEmailDeliveryJob: jest.fn() } as unknown as QueueService;
const configMock = { get: jest.fn(() => 'https://frontend.test') } as unknown as ConfigService;
const authMock = {} as unknown as AuthService;

function setupService() {
  prismaMock.$transaction.mockImplementation(async (cb: any) => {
    const tx = {
      employeeInvitation: { updateMany: jest.fn(), create: jest.fn((args: any) => args) },
      employee: { update: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    await cb(tx);
  });

  return Test.createTestingModule({
    providers: [
      InvitationsService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: QueueService, useValue: queueMock },
      { provide: ConfigService, useValue: configMock },
      { provide: AuthService, useValue: authMock },
    ],
  }).compile();
}

describe('InvitationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('issues a new invitation for employee with email', async () => {
    const moduleRef = await setupService();
    const service = moduleRef.get(InvitationsService);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      organisationId: 'org-1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'test@example.com',
      organisation: { name: 'Org' },
      invitations: [],
      userId: null,
    });
    prismaMock.employeeInvitation.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'user-1', role: Role.EMPLOYEE });
    (queueMock.addEmailDeliveryJob as jest.Mock).mockResolvedValue(true);

    const result = await service.issueInvitation({
      organisationId: 'org-1',
      employeeId: 'emp-1',
      invitedEmail: 'test@example.com',
      invitedByUserId: 'inviter-1',
      action: 'issue',
    });

    expect(result).toEqual({ success: true });
    expect(prismaMock.employeeInvitation.findFirst).toHaveBeenCalled();
    expect(queueMock.addEmailDeliveryJob).toHaveBeenCalled();
  });

  it('throws when employee already activated', async () => {
    const moduleRef = await setupService();
    const service = moduleRef.get(InvitationsService);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      organisationId: 'org-1',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'test@example.com',
      organisation: { name: 'Org' },
      invitations: [{ id: 'inv', status: InvitationStatus.ACCEPTED }],
      userId: 'user-1',
    });

    await expect(
      service.issueInvitation({
        organisationId: 'org-1',
        employeeId: 'emp-1',
        invitedEmail: 'test@example.com',
        invitedByUserId: 'inviter-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when employee missing', async () => {
    const moduleRef = await setupService();
    const service = moduleRef.get(InvitationsService);

    prismaMock.employee.findFirst.mockResolvedValue(null);

    await expect(
      service.issueInvitation({
        organisationId: 'org-1',
        employeeId: 'emp-1',
        invitedEmail: 'test@example.com',
        invitedByUserId: 'inviter-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
