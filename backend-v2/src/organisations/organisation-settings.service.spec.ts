import { OrganisationSettingsService } from './organisation-settings.service';
import { Role, SchedulePeriodType } from '@prisma/client';

const mockPrisma = {
  organisation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  location: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  employee: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockAuditService = {
  record: jest.fn(),
};

const mockInvitationsService = {
  issueInvitation: jest.fn(),
};

describe('OrganisationSettingsService', () => {
  let service: OrganisationSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganisationSettingsService(
      mockPrisma as any,
      mockAuditService as any,
      mockInvitationsService as any,
    );
  });

  it('updates organisation details and records audit', async () => {
    const before = { id: 'org-1', name: 'Firma', displayName: null };
    const updated = { ...before, displayName: 'Nowa nazwa' };

    mockPrisma.organisation.findUnique.mockResolvedValue(before);
    mockPrisma.organisation.update.mockResolvedValue(updated);

    const result = await service.updateOrganisationDetails(
      'org-1',
      { displayName: 'Nowa nazwa' },
      'user-1',
    );

    expect(result).toEqual(updated);
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        entityType: 'organisation',
      }),
    );
  });

  it('updates schedule settings and records audit', async () => {
    const before = {
      id: 'org-1',
      defaultWorkdayStart: '08:00',
      defaultWorkdayEnd: '16:00',
      defaultBreakMinutes: 30,
      workDays: [],
      schedulePeriod: SchedulePeriodType.WEEKLY,
    };
    const updated = {
      ...before,
      defaultWorkdayStart: '09:00',
      defaultBreakMinutes: 20,
    };

    mockPrisma.organisation.findUnique.mockResolvedValue(before);
    mockPrisma.organisation.update.mockResolvedValue(updated);

    const result = await service.updateScheduleSettings(
      'org-1',
      { defaultWorkdayStart: '09:00', defaultBreakMinutes: 20 },
      'actor-1',
    );

    expect(result.defaultWorkdayStart).toBe('09:00');
    expect(result.defaultBreakMinutes).toBe(20);
    expect(mockAuditService.record).toHaveBeenCalled();
  });

  it('creates a location and records audit', async () => {
    const location = {
      id: 'loc-1',
      organisationId: 'org-1',
      name: 'Centrum',
      isActive: true,
    };

    mockPrisma.location.create.mockResolvedValue(location);

    const result = await service.createLocation(
      'org-1',
      { name: 'Centrum', addressCity: 'Poznań' },
      'actor-1',
    );

    expect(result).toEqual(location);
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'location', action: 'CREATE' }),
    );
  });

  it('updates a location and records audit', async () => {
    const existing = { id: 'loc-2', organisationId: 'org-1', name: 'Sklep' };
    const updated = { ...existing, name: 'Sklep 2' };

    mockPrisma.location.findFirst.mockResolvedValue(existing);
    mockPrisma.location.update.mockResolvedValue(updated);

    const result = await service.updateLocation(
      'org-1',
      'loc-2',
      { name: 'Sklep 2' },
      'actor-1',
    );

    expect(result.name).toBe('Sklep 2');
    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'location', action: 'UPDATE' }),
    );
  });

  it('toggles location status', async () => {
    mockPrisma.location.findFirst.mockResolvedValue({
      id: 'loc-3',
      organisationId: 'org-1',
      isActive: false,
    });
    mockPrisma.location.update.mockResolvedValue({
      id: 'loc-3',
      organisationId: 'org-1',
      isActive: true,
    });

    const result = await service.toggleLocation('org-1', 'loc-3', 'actor-1');
    expect(result.isActive).toBe(true);
  });

  it('lists members with status', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
        role: Role.MANAGER,
        avatarUrl: null,
        avatarPath: null,
        createdAt: new Date(),
        employee: { invitations: [] },
      },
      {
        id: 'user-2',
        email: 'c@example.com',
        firstName: 'C',
        lastName: 'D',
        role: Role.EMPLOYEE,
        avatarUrl: null,
        avatarPath: null,
        createdAt: new Date(),
        employee: { invitations: [{ id: 'inv-1' }] },
      },
    ]);

    const result = await service.listMembers('org-1');
    expect(result[0].status).toBe('ACTIVE');
    expect(result[1].status).toBe('INVITED');
  });

  it('prevents removing last owner role', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'owner-1',
      organisationId: 'org-1',
      role: Role.OWNER,
    });
    mockPrisma.user.count.mockResolvedValue(1);

    await expect(
      service.updateMemberRole(
        'org-1',
        'actor-1',
        Role.OWNER,
        'owner-1',
        { role: Role.ADMIN },
      ),
    ).rejects.toThrow('Nie można odebrać roli ostatniemu właścicielowi');
  });
});
