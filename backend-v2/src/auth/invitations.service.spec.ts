import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { InvitationStatus } from '@prisma/client';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = {
      employeeInvitation: {
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: { addEmailDeliveryJob: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(InvitationsService);
  });

  it('rejects invalid invitation token', async () => {
    prisma.employeeInvitation.findFirst.mockResolvedValue(null as never);

    await expect(
      service.acceptInvitation('invalid', 'Password123!', {} as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates pending invitation metadata', async () => {
    const now = new Date();
    prisma.employeeInvitation.findFirst.mockResolvedValue({
      id: '1',
      organisationId: 'org1',
      employeeId: 'emp1',
      invitedEmail: 'test@example.com',
      tokenHash: 'hash',
      status: InvitationStatus.PENDING,
      expiresAt: now,
      acceptedAt: null,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
      organisation: { id: 'org1', name: 'ACME' },
      employee: { id: 'emp1', firstName: 'Jan', lastName: 'Kowalski' },
    } as any);

    const result = await service.validateInvitation('token');

    expect(result).toMatchObject({
      organisationName: 'ACME',
      invitedEmail: 'test@example.com',
      employee: { firstName: 'Jan', lastName: 'Kowalski' },
    });
  });
});
