import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAdapter } from './email.adapter';

const AVAILABLE_TYPES: NotificationType[] = [
  NotificationType.TEST,
  NotificationType.LEAVE_STATUS,
  NotificationType.SHIFT_ASSIGNMENT,
];

type PreferenceInput = {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
};

type CreateNotificationInput = {
  organisationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  emailSubject?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  async list(
    organisationId: string,
    userId: string,
    query: { skip?: number; take?: number; unreadOnly?: boolean },
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
            organisationId,
          },
          create: {
            organisationId,
            userId,
            type: pref.type,
            inApp: pref.inApp,
            email: pref.email,
          },
        }),
      ),
    );

    return this.getPreferences(organisationId, userId);
  }

  async createNotification(input: CreateNotificationInput) {
    const preference = await this.prisma.notificationPreference.findFirst({
      where: {
        organisationId: input.organisationId,
        userId: input.userId,
        type: input.type,
      },
    });

    const deliverInApp = preference?.inApp ?? true;
    const deliverEmail = preference?.email ?? false;
    const channels: NotificationChannel[] = [];

    if (deliverInApp) {
      channels.push(NotificationChannel.IN_APP);
    }
    if (deliverEmail) {
      channels.push(NotificationChannel.EMAIL);
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

    if (channels.includes(NotificationChannel.EMAIL)) {
      await this.attemptEmailDelivery(notification, input);
    }

    return notification;
  }

  async sendTestNotification(organisationId: string, userId: string) {
    return this.createNotification({
      organisationId,
      userId,
      type: NotificationType.TEST,
      title: 'Powiadomienie testowe',
      body: 'To jest przykładowe powiadomienie testowe.',
      data: { kind: 'test' },
    });
  }

  private async attemptEmailDelivery(
    notification: { id: string; userId: string; title: string; body?: string | null },
    input: Pick<CreateNotificationInput, 'emailSubject'>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    let status: NotificationDeliveryStatus = NotificationDeliveryStatus.SKIPPED;
    let errorMessage: string | null = null;

    if (user?.email) {
      const result = await this.emailAdapter.sendEmail({
        to: user.email,
        subject: input.emailSubject ?? notification.title,
        text: notification.body ?? notification.title,
      });

      if (result.success) {
        status = NotificationDeliveryStatus.SENT;
      } else if (result.skipped) {
        status = NotificationDeliveryStatus.SKIPPED;
        errorMessage = result.error ?? null;
      } else {
        status = NotificationDeliveryStatus.FAILED;
        errorMessage = result.error ?? 'Email delivery failed';
      }
    } else {
      status = NotificationDeliveryStatus.SKIPPED;
      errorMessage = 'User email missing';
    }

    await this.prisma.notificationDeliveryAttempt.create({
      data: {
        notificationId: notification.id,
        channel: NotificationChannel.EMAIL,
        status,
        errorMessage,
      },
    });
  }
}
