import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAdapter } from '../email/email.adapter';
import { EmailTemplatesService } from '../email/email-templates.service';
import { SmsAdapter } from '../sms/sms.adapter';
import { QueueService } from '../queue/queue.service';

const mockPrisma = {
  $transaction: jest.fn(),
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
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
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockEmail: Partial<EmailAdapter> = {
  sendEmail: jest.fn(),
};

const mockEmailTemplates: Partial<EmailTemplatesService> = {
  testNotificationTemplate: jest.fn().mockReturnValue({
    subject: 'Test',
    text: 'Test message',
    html: '<p>Test</p>',
  }),
  genericTemplate: jest.fn().mockReturnValue({
    subject: 'Generic',
    text: 'Generic message',
    html: '<p>Generic</p>',
  }),
};

const mockSms: Partial<SmsAdapter> = {
  sendSms: jest.fn().mockResolvedValue({ success: true }),
  isEnabled: jest.fn().mockReturnValue(false),
};

const mockQueue: Partial<QueueService> = {
  addEmailDeliveryJob: jest.fn(),
  isQueueAvailable: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailAdapter, useValue: mockEmail },
        { provide: EmailTemplatesService, useValue: mockEmailTemplates },
        { provide: SmsAdapter, useValue: mockSms },
        { provide: QueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get(NotificationsService);
    jest.clearAllMocks();

    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);
    mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
    mockPrisma.notificationPreference.findFirst.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      title: 'Test',
      channels: [NotificationChannel.IN_APP],
    });
    mockPrisma.notificationDeliveryAttempt.create.mockResolvedValue({
      id: 'attempt-1',
    });
    mockPrisma.notificationDeliveryAttempt.update.mockResolvedValue({
      id: 'attempt-1',
      status: NotificationDeliveryStatus.SENT,
    });
    (mockEmail.sendEmail as jest.Mock).mockResolvedValue({ success: true });
    (mockQueue.addEmailDeliveryJob as jest.Mock).mockResolvedValue(true);
    (mockQueue.isQueueAvailable as jest.Mock).mockReturnValue(false);
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'demo@example.com' });
    mockPrisma.$transaction.mockImplementation(async (operations: any[]) =>
      Promise.all(operations),
    );
  });

  it('returns unread count together with notification list', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([{ id: '1' }]);
    mockPrisma.notification.count
      .mockResolvedValueOnce(1) // total
      .mockResolvedValueOnce(1); // unread

    const result = await service.list('org-1', 'user-1', { take: 10, skip: 0 });

    expect(result).toEqual(
      expect.objectContaining({
        total: 1,
        unreadCount: 1,
        data: [{ id: '1' }],
      }),
    );
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: 'org-1',
          userId: 'user-1',
        }),
        take: 10,
        skip: 0,
      }),
    );
  });

  it('respects preferences and sends email when enabled', async () => {
    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      inApp: false,
      email: true,
      sms: false,
      type: NotificationType.TEST,
    });

    await service.createNotification({
      organisationId: 'org-1',
      userId: 'user-1',
      type: NotificationType.TEST,
      title: 'Email only',
    });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channels: [NotificationChannel.EMAIL],
        }),
      }),
    );
    // Check that delivery attempt was created (initial status is SKIPPED/pending)
    expect(mockPrisma.notificationDeliveryAttempt.create).toHaveBeenCalled();
    // Check that delivery attempt was updated to SENT after email was sent
    expect(mockPrisma.notificationDeliveryAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: NotificationDeliveryStatus.SENT,
        }),
      }),
    );
  });

  it('skips creation when all channels disabled in preferences', async () => {
    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      inApp: false,
      email: false,
      sms: false,
      type: NotificationType.TEST,
    });

    const result = await service.createNotification({
      organisationId: 'org-1',
      userId: 'user-1',
      type: NotificationType.TEST,
      title: 'Muted',
    });

    expect(result).toBeNull();
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('marks notification as read', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      readAt: null,
    });
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif-1',
      readAt: new Date(),
    });

    const updated = await service.markAsRead('org-1', 'user-1', 'notif-1');

    expect(updated.readAt).toBeInstanceOf(Date);
    expect(mockPrisma.notification.update).toHaveBeenCalled();
  });

  it('sends SMS when preference is enabled and SMS adapter is enabled', async () => {
    (mockSms.isEnabled as jest.Mock).mockReturnValue(true);
    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      inApp: true,
      email: false,
      sms: true,
      type: NotificationType.SHIFT_ASSIGNMENT,
    });
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-2',
      userId: 'user-1',
      title: 'Shift assigned',
      channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      employee: { phone: '+48123456789' },
    });

    await service.createNotification({
      organisationId: 'org-1',
      userId: 'user-1',
      type: NotificationType.SHIFT_ASSIGNMENT,
      title: 'Shift assigned',
    });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channels: expect.arrayContaining([
            NotificationChannel.IN_APP,
            NotificationChannel.SMS,
          ]),
        }),
      }),
    );
    expect(mockSms.sendSms).toHaveBeenCalled();
  });
});
