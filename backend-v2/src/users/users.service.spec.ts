import { UsersService } from './users.service';
import { Role } from '@prisma/client';

const mockPrisma = {
  user: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockAuditService = {
  record: jest.fn(),
};

const mockNotificationsService = {
  sendUserCreatedNotification: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('https://app.example.com'),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      mockPrisma as any,
      mockAuditService as any,
      mockNotificationsService as any,
      mockConfigService as any,
    );
  });

  it('creates a user and logs audit + notification', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'user@example.com',
      role: Role.MANAGER,
      organisationId: 'org-1',
      firstName: 'Anna',
      lastName: 'Nowak',
      createdAt: new Date(),
    };

    mockPrisma.user.create.mockResolvedValue(createdUser);

    const result = await service.create('actor-1', 'org-1', {
      email: 'user@example.com',
      password: 'StrongPass123!',
      role: Role.MANAGER,
      firstName: 'Anna',
      lastName: 'Nowak',
    });

    expect(result).toEqual(createdUser);
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'actor-1',
        action: 'CREATE',
        entityType: 'user',
        entityId: createdUser.id,
      }),
    );
    expect(mockNotificationsService.sendUserCreatedNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        userId: createdUser.id,
        createdByUserId: 'actor-1',
      }),
    );
  });

  it('updates a user and logs audit trail', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      organisationId: 'org-1',
      firstName: 'Adam',
      lastName: 'Kowalski',
      role: Role.EMPLOYEE,
    });

    const updatedUser = {
      id: 'user-2',
      email: 'adam@example.com',
      role: Role.EMPLOYEE,
      firstName: 'Adam',
      lastName: 'Nowak',
      createdAt: new Date(),
    };

    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const result = await service.update('actor-2', 'user-2', 'org-1', {
      firstName: 'Adam',
      lastName: 'Nowak',
    });

    expect(result).toEqual(updatedUser);
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'actor-2',
        action: 'UPDATE',
        entityType: 'user',
        entityId: 'user-2',
      }),
    );
  });
});
