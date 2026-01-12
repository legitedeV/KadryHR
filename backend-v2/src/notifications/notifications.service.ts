import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAdapter } from '../email/email.adapter';
import { EmailTemplatesService } from '../email/email-templates.service';
import { SmsAdapter } from '../sms/sms.adapter';
import { QueueService } from '../queue/queue.service';

const AVAILABLE_TYPES: NotificationType[] = [
  NotificationType.TEST,
  NotificationType.LEAVE_STATUS,
  NotificationType.SHIFT_ASSIGNMENT,
  NotificationType.SCHEDULE_PUBLISHED,
  NotificationType.SWAP_STATUS,
  NotificationType.AVAILABILITY_SUBMITTED,
  NotificationType.CUSTOM,
];

type PreferenceInput = {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms?: boolean;
  push?: boolean;
};

type CreateNotificationInput = {
  organisationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  channels?: NotificationChannel[];
  emailSubject?: string;
  emailHtml?: string;
  smsMessage?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly smsAdapter: SmsAdapter,
    private readonly queueService: QueueService,
  ) {}

  async list(
    organisationId: string,
    userId: string,
    query: {
      skip?: number;
      take?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    },
  ) {
    const take = Math.min(Math.max(query.take ?? 20, 1), 100);
    const skip = Math.max(query.skip ?? 0, 0);

    const where: Prisma.NotificationWhereInput = {
      organisationId,
      userId,
      channels: { has: NotificationChannel.IN_APP },
    };

    if (query.unreadOnly) {
      where.readAt = null;
    }

    if (query.type) {
      where.type = query.type;
    }

    const [data, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          organisationId,
          userId,
          channels: { has: NotificationChannel.IN_APP },
          readAt: null,
        },
      }),
    ]);

    return {
      data,
      total,
      skip,
      take,
      unreadCount,
    };
  }

  async unreadCount(organisationId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        organisationId,
        userId,
        channels: { has: NotificationChannel.IN_APP },
        readAt: null,
      },
    });

    return { count };
  }

  async markAsRead(organisationId: string, userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        organisationId,
        userId,
        channels: { has: NotificationChannel.IN_APP },
      },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.readAt) {
      return existing;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(organisationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        organisationId,
        userId,
        channels: { has: NotificationChannel.IN_APP },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }

  async getPreferences(organisationId: string, userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { organisationId, userId },
    });

    return AVAILABLE_TYPES.map((type) => {
      const pref = prefs.find((p) => p.type === type);
      return {
        type,
        inApp: pref?.inApp ?? true,
        email: pref?.email ?? false,
        sms: pref?.sms ?? false,
        push: pref?.push ?? false, // Future: push notifications
      };
    });
  }

  async updatePreferences(
    organisationId: string,
    userId: string,
    preferences: PreferenceInput[],
  ) {
    await Promise.all(
      preferences.map((pref) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_type: {
              userId,
              type: pref.type,
            },
          },
          update: {
            inApp: pref.inApp,
            email: pref.email,
            sms: pref.sms ?? false,
            push: pref.push ?? false,
            organisationId,
          },
          create: {
            organisationId,
            userId,
            type: pref.type,
            inApp: pref.inApp,
            email: pref.email,
            sms: pref.sms ?? false,
            push: pref.push ?? false,
          },
        }),
      ),
    );

    return this.getPreferences(organisationId, userId);
  }

  async createNotification(input: CreateNotificationInput) {
    // If channels are explicitly provided (e.g., from campaign), use them
    const channels: NotificationChannel[] = input.channels ?? [];

    // Otherwise, check user preferences
    if (channels.length === 0) {
      const preference = await this.prisma.notificationPreference.findFirst({
        where: {
          organisationId: input.organisationId,
          userId: input.userId,
          type: input.type,
        },
      });

      const deliverInApp = preference?.inApp ?? true;
      const deliverEmail = preference?.email ?? false;
      const deliverSms = preference?.sms ?? false;
      // TODO: Push notifications - future implementation
      // const deliverPush = preference?.push ?? false;

      if (deliverInApp) {
        channels.push(NotificationChannel.IN_APP);
      }
      if (deliverEmail) {
        channels.push(NotificationChannel.EMAIL);
      }
      if (deliverSms && this.smsAdapter.isEnabled()) {
        channels.push(NotificationChannel.SMS);
      }
      // TODO: Add PUSH channel when implemented
      // if (deliverPush) {
      //   channels.push(NotificationChannel.PUSH);
      // }
    }

    if (channels.length === 0) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        organisationId: input.organisationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        data: input.data ?? Prisma.JsonNull,
        channels,
      },
    });

    // Process delivery channels
    if (channels.includes(NotificationChannel.EMAIL)) {
      await this.attemptEmailDelivery(notification, input);
    }

    if (channels.includes(NotificationChannel.SMS)) {
      await this.attemptSmsDelivery(notification, input);
    }

    // TODO: Push notifications - future implementation
    // if (channels.includes(NotificationChannel.PUSH)) {
    //   await this.attemptPushDelivery(notification, input);
    // }

    return notification;
  }

  async sendTestNotification(organisationId: string, userId: string) {
    // Get user details for the email template
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    const emailTemplate = this.emailTemplates.testNotificationTemplate({
      recipientEmail: user?.email ?? 'unknown',
      recipientName: user?.firstName ?? undefined,
    });

    return this.createNotification({
      organisationId,
      userId,
      type: NotificationType.TEST,
      title: 'Powiadomienie testowe',
      body: 'To jest przykładowe powiadomienie testowe.',
      data: { kind: 'test' },
      emailSubject: emailTemplate.subject,
      emailHtml: emailTemplate.html,
      smsMessage: 'KadryHR: To jest testowa wiadomość SMS.',
    });
  }

  private async attemptEmailDelivery(
    notification: {
      id: string;
      userId: string;
      title: string;
      body?: string | null;
      organisationId?: string;
    },
    input: Pick<
      CreateNotificationInput,
      'emailSubject' | 'emailHtml' | 'organisationId'
    >,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        organisationId: true,
      },
    });

    if (!user?.email) {
      await this.prisma.notificationDeliveryAttempt.create({
        data: {
          notificationId: notification.id,
          channel: NotificationChannel.EMAIL,
          status: NotificationDeliveryStatus.SKIPPED,
          errorMessage: 'User email missing',
        },
      });
      return;
    }

    // Create initial delivery attempt record
    const deliveryAttempt =
      await this.prisma.notificationDeliveryAttempt.create({
        data: {
          notificationId: notification.id,
          channel: NotificationChannel.EMAIL,
          status: NotificationDeliveryStatus.SKIPPED,
          errorMessage: 'Pending delivery',
        },
      });

    // Use provided HTML template or generate a generic one
    const emailHtml =
      input.emailHtml ??
      this.emailTemplates.genericTemplate({
        title: notification.title,
        body: notification.body ?? notification.title,
        recipientName: user.firstName ?? undefined,
      }).html;

    // Try to add to queue first
    if (this.queueService.isQueueAvailable()) {
      const queued = await this.queueService.addEmailDeliveryJob({
        notificationId: notification.id,
        to: user.email,
        subject: input.emailSubject ?? notification.title,
        text: notification.body ?? notification.title,
        html: emailHtml,
        organisationId: input.organisationId ?? '',
        userId: notification.userId,
      });

      if (queued) {
        this.logger.log(
          `Email delivery job queued for notification ${notification.id}`,
        );
        return;
      }
    }

    // Fallback to synchronous delivery if queue is not available
    this.logger.warn(
      `Queue not available, sending email synchronously for notification ${notification.id}`,
    );

    const result = await this.emailAdapter.sendEmail({
      to: user.email,
      subject: input.emailSubject ?? notification.title,
      text: notification.body ?? notification.title,
      html: emailHtml,
    });

    let status: NotificationDeliveryStatus;
    let errorMessage: string | null = null;

    if (result.success) {
      status = NotificationDeliveryStatus.SENT;
    } else if (result.skipped) {
      status = NotificationDeliveryStatus.SKIPPED;
      errorMessage = result.error ?? null;
    } else {
      status = NotificationDeliveryStatus.FAILED;
      errorMessage = result.error ?? 'Email delivery failed';
    }

    await this.prisma.notificationDeliveryAttempt.update({
      where: { id: deliveryAttempt.id },
      data: {
        status,
        errorMessage,
      },
    });
  }

  private async attemptSmsDelivery(
    notification: {
      id: string;
      userId: string;
      title: string;
      body?: string | null;
    },
    input: Pick<CreateNotificationInput, 'smsMessage'>,
  ) {
    // Get user with their employee record for phone number
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: {
        id: true,
        firstName: true,
        employee: {
          select: { phone: true },
        },
      },
    });

    const phone = user?.employee?.phone;
    if (!phone) {
      await this.prisma.notificationDeliveryAttempt.create({
        data: {
          notificationId: notification.id,
          channel: NotificationChannel.SMS,
          status: NotificationDeliveryStatus.SKIPPED,
          errorMessage: 'User phone number missing',
        },
      });
      this.logger.warn(
        `SMS skipped for notification ${notification.id}: no phone number`,
      );
      return;
    }

    const message =
      input.smsMessage ??
      `KadryHR: ${notification.title}${notification.body ? ` - ${notification.body}` : ''}`.substring(
        0,
        160,
      );

    const result = await this.smsAdapter.sendSms(phone, message);

    let status: NotificationDeliveryStatus;
    let errorMessage: string | null = null;

    if (result.success && !result.skipped) {
      status = NotificationDeliveryStatus.SENT;
      this.logger.log(
        `SMS sent for notification ${notification.id} to ${phone}`,
      );
    } else if (result.skipped) {
      status = NotificationDeliveryStatus.SKIPPED;
      errorMessage = result.error ?? 'SMS adapter not configured';
      this.logger.warn(
        `SMS skipped for notification ${notification.id}: ${errorMessage}`,
      );
    } else {
      status = NotificationDeliveryStatus.FAILED;
      errorMessage = result.error ?? 'SMS delivery failed';
      this.logger.error(
        `SMS failed for notification ${notification.id}: ${errorMessage}`,
      );
    }

    await this.prisma.notificationDeliveryAttempt.create({
      data: {
        notificationId: notification.id,
        channel: NotificationChannel.SMS,
        status,
        errorMessage,
      },
    });
  }

  // TODO: Push notification delivery - future implementation
  // private async attemptPushDelivery(
  //   notification: { id: string; userId: string; title: string; body?: string | null },
  //   _input: Pick<CreateNotificationInput, 'data'>,
  // ) {
  //   // Implementation for web push / mobile push notifications
  //   // Will need: push subscription management, FCM/APNs integration
  //   this.logger.log(`Push delivery not yet implemented for notification ${notification.id}`);
  // }
}
