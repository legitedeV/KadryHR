import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';

describe('CampaignService - Audience Resolution', () => {
  let service: CampaignService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationCampaign: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    notificationRecipient: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveAudience', () => {
    const organisationId = 'org-123';

    it('should return all users when filter.all is true', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      // Access private method via (service as any)
      const result = await (service as any).resolveAudience(organisationId, {
        all: true,
      });

      expect(result).toEqual(['user-1', 'user-2', 'user-3']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { organisationId },
        select: { id: true },
      });
    });

    it('should filter users by roles', async () => {
      const mockUsers = [
        { id: 'manager-1' },
        { id: 'manager-2' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await (service as any).resolveAudience(organisationId, {
        roles: [Role.MANAGER],
      });

      expect(result).toEqual(['manager-1', 'manager-2']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          role: { in: [Role.MANAGER] },
        },
        select: { id: true },
      });
    });

    it('should filter users by multiple roles', async () => {
      const mockUsers = [
        { id: 'manager-1' },
        { id: 'owner-1' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await (service as any).resolveAudience(organisationId, {
        roles: [Role.MANAGER, Role.OWNER],
      });

      expect(result).toEqual(['manager-1', 'owner-1']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          role: { in: [Role.MANAGER, Role.OWNER] },
        },
        select: { id: true },
      });
    });

    it('should filter users by location', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await (service as any).resolveAudience(organisationId, {
        locationIds: ['loc-1', 'loc-2'],
      });

      expect(result).toEqual(['user-1', 'user-2']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          employee: {
            locations: {
              some: {
                locationId: { in: ['loc-1', 'loc-2'] },
              },
            },
          },
        },
        select: { id: true },
      });
    });

    it('should filter users by employee IDs', async () => {
      const mockUsers = [
        { id: 'user-1' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await (service as any).resolveAudience(organisationId, {
        employeeIds: ['emp-1', 'emp-2'],
      });

      expect(result).toEqual(['user-1']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          employee: {
            id: { in: ['emp-1', 'emp-2'] },
          },
        },
        select: { id: true },
      });
    });

    it('should combine role and location filters', async () => {
      const mockUsers = [
        { id: 'employee-1' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await (service as any).resolveAudience(organisationId, {
        roles: [Role.EMPLOYEE],
        locationIds: ['loc-1'],
      });

      expect(result).toEqual(['employee-1']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          role: { in: [Role.EMPLOYEE] },
          employee: {
            locations: {
              some: {
                locationId: { in: ['loc-1'] },
              },
            },
          },
        },
        select: { id: true },
      });
    });

    it('should return empty array when no users match', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await (service as any).resolveAudience(organisationId, {
        roles: [Role.MANAGER],
      });

      expect(result).toEqual([]);
    });
  });
});
