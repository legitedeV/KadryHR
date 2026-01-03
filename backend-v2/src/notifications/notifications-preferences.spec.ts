import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAdapter } from './email.adapter';
import { QueueService } from '../queue/queue.service';
import { NotificationType, NotificationChannel } from '@prisma/client';

describe('NotificationsService - Preference Filtering', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notificationPreference: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    notificationDeliveryAttempt: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailAdapter = {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockQueueService = {
    addEmailDeliveryJob: jest.fn().mockResolvedValue(true),
    isQueueAvailable: jest.fn().mockReturnValue(false), // Default to sync
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailAdapter, useValue: mockEmailAdapter },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('preference filtering', () => {
    const organisationId = 'org-123';
    const userId = 'user-123';

    it('should use default preferences (inApp=true, email=false) when no preference exists', async () => {
      mockPrismaService.notificationPreference.findFirst.mockResolvedValue(null);
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test',
        body: null,
        data: {},
        channels: [NotificationChannel.IN_APP],
        readAt: null,
        createdAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test Notification',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.IN_APP],
        }),
      });
    });

    it('should respect user preference for in-app only', async () => {
      mockPrismaService.notificationPreference.findFirst.mockResolvedValue({
        id: 'pref-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        inApp: true,
        email: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test',
        body: null,
        data: {},
        channels: [NotificationChannel.IN_APP],
        readAt: null,
        createdAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test Notification',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.IN_APP],
        }),
      });
    });

    it('should respect user preference for email only', async () => {
      mockPrismaService.notificationPreference.findFirst.mockResolvedValue({
        id: 'pref-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        inApp: false,
        email: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test',
        body: null,
        data: {},
        channels: [NotificationChannel.EMAIL],
        readAt: null,
        createdAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        organisationId,
      });

      mockPrismaService.notificationDeliveryAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SKIPPED',
        errorMessage: 'Pending delivery',
        createdAt: new Date(),
      });

      mockPrismaService.notificationDeliveryAttempt.update.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SENT',
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test Notification',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.EMAIL],
        }),
      });
    });

    it('should respect user preference for both channels', async () => {
      mockPrismaService.notificationPreference.findFirst.mockResolvedValue({
        id: 'pref-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        inApp: true,
        email: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test',
        body: null,
        data: {},
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        readAt: null,
        createdAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        organisationId,
      });

      mockPrismaService.notificationDeliveryAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SKIPPED',
        errorMessage: 'Pending delivery',
        createdAt: new Date(),
      });

      mockPrismaService.notificationDeliveryAttempt.update.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SENT',
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test Notification',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        }),
      });
    });

    it('should return null when user has disabled all channels', async () => {
      mockPrismaService.notificationPreference.findFirst.mockResolvedValue({
        id: 'pref-1',
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        inApp: false,
        email: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.LEAVE_STATUS,
        title: 'Test Notification',
      });

      expect(result).toBeNull();
      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });

    it('should use explicit channels when provided (ignore preferences)', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        organisationId,
        userId,
        type: NotificationType.CUSTOM,
        title: 'Test',
        body: null,
        data: {},
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        readAt: null,
        createdAt: new Date(),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        organisationId,
      });

      mockPrismaService.notificationDeliveryAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SKIPPED',
        errorMessage: 'Pending delivery',
        createdAt: new Date(),
      });

      mockPrismaService.notificationDeliveryAttempt.update.mockResolvedValue({
        id: 'attempt-1',
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: 'SENT',
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await service.createNotification({
        organisationId,
        userId,
        type: NotificationType.CUSTOM,
        title: 'Test Notification',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        }),
      });
      // Preferences should not be checked when explicit channels provided
      expect(mockPrismaService.notificationPreference.findFirst).not.toHaveBeenCalled();
    });
  });
});
