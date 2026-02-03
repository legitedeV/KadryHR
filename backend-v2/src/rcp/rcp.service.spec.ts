import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RcpService } from './rcp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RcpTokenService } from './services/rcp-token.service';
import { RcpRateLimitService } from './services/rcp-rate-limit.service';
import { RcpEventType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('RcpService - Integration', () => {
  let service: RcpService;
  let prismaService: PrismaService;
  let tokenService: RcpTokenService;

  const mockOrg = { id: 'test-org', name: 'Test Org' };
  const mockUser = {
    id: 'test-user',
    organisationId: mockOrg.id,
    email: 'test@example.com',
  };
  const mockLocation = {
    id: 'test-location',
    organisationId: mockOrg.id,
    name: 'Test Location',
    address: 'Test Address',
    geoLat: 52.2297,
    geoLng: 21.0122,
    geoRadiusMeters: 100,
    rcpEnabled: true,
    rcpAccuracyMaxMeters: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    location: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    rcpQrConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    rcpEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        RcpService,
        RcpTokenService,
        RcpRateLimitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RcpService>(RcpService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokenService = module.get<RcpTokenService>(RcpTokenService);

    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((actions) =>
      Promise.all(actions),
    );
  });

  describe('generateQr', () => {
    it('should generate QR code with valid token', async () => {
      mockPrismaService.location.findFirst.mockResolvedValue(mockLocation);
      mockPrismaService.rcpQrConfig.findUnique.mockResolvedValue(null);
      mockPrismaService.rcpQrConfig.create.mockResolvedValue({
        id: 'config-id',
        organisationId: mockOrg.id,
        locationId: mockLocation.id,
        tokenTtlSeconds: 3600,
        rotateMode: 'STATIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.generateQr(
        mockUser.id,
        mockOrg.id,
        mockLocation.id,
        'http://localhost:3000',
      );

      expect(result.qrUrl).toContain('/m/rcp?token=');
      expect(result.tokenExpiresAt).toBeInstanceOf(Date);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'RCP_QR_GENERATE',
          }),
        }),
      );
    });

    it('should throw error if location does not exist', async () => {
      mockPrismaService.location.findFirst.mockResolvedValue(null);

      await expect(
        service.generateQr(
          mockUser.id,
          mockOrg.id,
          'non-existent',
          'http://localhost:3000',
        ),
      ).rejects.toThrow('Location not found');
    });

    it('should throw error if RCP is not enabled', async () => {
      mockPrismaService.location.findFirst.mockResolvedValue({
        ...mockLocation,
        rcpEnabled: false,
      });

      await expect(
        service.generateQr(
          mockUser.id,
          mockOrg.id,
          mockLocation.id,
          'http://localhost:3000',
        ),
      ).rejects.toThrow('RCP is not enabled for this location');
    });
  });

  describe('clock', () => {
    it('should successfully clock in when within geofence', async () => {
      const { token } = tokenService.generateToken(
        mockOrg.id,
        mockLocation.id,
        3600,
      );

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue(null);
      mockPrismaService.rcpEvent.create.mockResolvedValue({
        id: 'event-id',
        type: 'CLOCK_IN',
        happenedAt: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      // Client is 50m away from location
      const clientLat = 52.23015;
      const clientLng = 21.0122;

      const result = await service.clock(
        mockUser.id,
        mockOrg.id,
        token,
        RcpEventType.CLOCK_IN,
        clientLat,
        clientLng,
        50,
        undefined,
        undefined,
        undefined,
      );

      expect(result.ok).toBe(true);
      expect(result.distanceMeters).toBeLessThan(100);
      expect(result.type).toBe('CLOCK_IN');
      expect(mockPrismaService.rcpEvent.create).toHaveBeenCalled();
    });

    it('should reject clock when outside geofence', async () => {
      const { token } = tokenService.generateToken(
        mockOrg.id,
        mockLocation.id,
        3600,
      );

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      // Client is 200m away from location (outside 100m radius)
      const clientLat = 52.2315;
      const clientLng = 21.0122;

      await expect(
        service.clock(
          mockUser.id,
          mockOrg.id,
          token,
          RcpEventType.CLOCK_IN,
          clientLat,
          clientLng,
          50,
          undefined,
          undefined,
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'RCP_DENIED',
          }),
        }),
      );
    });

    it('should reject clock when accuracy is too low', async () => {
      const { token } = tokenService.generateToken(
        mockOrg.id,
        mockLocation.id,
        3600,
      );

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      const clientLat = 52.23015;
      const clientLng = 21.0122;

      await expect(
        service.clock(
          mockUser.id,
          mockOrg.id,
          token,
          RcpEventType.CLOCK_IN,
          clientLat,
          clientLng,
          150, // Accuracy 150m > max 100m
          undefined,
          undefined,
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject double clock-in', async () => {
      const { token } = tokenService.generateToken(
        mockOrg.id,
        mockLocation.id,
        3600,
      );

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue({
        id: 'last-event',
        type: 'CLOCK_IN',
        happenedAt: new Date(),
      });

      const clientLat = 52.23015;
      const clientLng = 21.0122;

      await expect(
        service.clock(
          mockUser.id,
          mockOrg.id,
          token,
          RcpEventType.CLOCK_IN,
          clientLat,
          clientLng,
          50,
          undefined,
          undefined,
          undefined,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully clock out after clock in', async () => {
      const { token } = tokenService.generateToken(
        mockOrg.id,
        mockLocation.id,
        3600,
      );

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue({
        id: 'last-event',
        type: 'CLOCK_IN',
        happenedAt: new Date(Date.now() - 3600000), // 1 hour ago
      });
      mockPrismaService.rcpEvent.create.mockResolvedValue({
        id: 'event-id',
        type: 'CLOCK_OUT',
        happenedAt: new Date(),
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const clientLat = 52.23015;
      const clientLng = 21.0122;

      const result = await service.clock(
        mockUser.id,
        mockOrg.id,
        token,
        RcpEventType.CLOCK_OUT,
        clientLat,
        clientLng,
        50,
        undefined,
        undefined,
        undefined,
      );

      expect(result.ok).toBe(true);
      expect(result.type).toBe('CLOCK_OUT');
    });
  });

  describe('getStatus', () => {
    it('should return status as clocked in', async () => {
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue({
        id: 'event-id',
        type: 'CLOCK_IN',
        happenedAt: new Date(),
        location: { name: 'Test Location' },
      });

      const result = await service.getStatus(mockUser.id, mockOrg.id);

      expect(result.isClockedIn).toBe(true);
      expect(result.lastEvent?.type).toBe('CLOCK_IN');
    });

    it('should return status as clocked out', async () => {
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue({
        id: 'event-id',
        type: 'CLOCK_OUT',
        happenedAt: new Date(),
        location: { name: 'Test Location' },
      });

      const result = await service.getStatus(mockUser.id, mockOrg.id);

      expect(result.isClockedIn).toBe(false);
      expect(result.lastEvent?.type).toBe('CLOCK_OUT');
    });

    it('should return no status when no events', async () => {
      mockPrismaService.rcpEvent.findFirst.mockResolvedValue(null);

      const result = await service.getStatus(mockUser.id, mockOrg.id);

      expect(result.isClockedIn).toBe(false);
      expect(result.lastEvent).toBeNull();
    });
  });

  describe('listEventsForUser', () => {
    it('should list user events with pagination', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          type: 'CLOCK_IN',
          happenedAt: new Date('2024-05-01T08:00:00Z'),
          locationId: mockLocation.id,
          location: { name: mockLocation.name },
          distanceMeters: 12,
          accuracyMeters: 20,
        },
      ];

      mockPrismaService.rcpEvent.count.mockResolvedValue(1);
      mockPrismaService.rcpEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.listEventsForUser(
        mockUser.id,
        mockOrg.id,
        { take: 10, skip: 0 },
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].locationName).toBe(mockLocation.name);
      expect(mockPrismaService.rcpEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ organisationId: mockOrg.id }),
              expect.objectContaining({ userId: mockUser.id }),
            ]),
          }),
        }),
      );
    });
  });

  describe('listEventsForOrganisation', () => {
    it('should list organisation events with user details', async () => {
      const mockEvents = [
        {
          id: 'event-2',
          type: 'CLOCK_OUT',
          happenedAt: new Date('2024-05-01T16:00:00Z'),
          locationId: mockLocation.id,
          location: { name: mockLocation.name },
          distanceMeters: 8,
          accuracyMeters: 10,
          user: {
            id: mockUser.id,
            firstName: 'Jan',
            lastName: 'Kowalski',
            email: mockUser.email,
          },
        },
      ];

      mockPrismaService.rcpEvent.count.mockResolvedValue(1);
      mockPrismaService.rcpEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.listEventsForOrganisation(mockOrg.id, {
        take: 5,
      });

      expect(result.items[0].user?.email).toBe(mockUser.email);
      expect(mockPrismaService.rcpEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: mockOrg.id,
          }),
          include: expect.objectContaining({
            user: true,
          }),
        }),
      );
    });
  });
});
