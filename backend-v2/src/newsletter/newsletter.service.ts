import {
  Injectable,
  Logger,
  BadRequestException,
  TooManyRequestsException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NewsletterSubscriptionStatus, Prisma } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { buildWelcomeNewsletterHtml } from './templates/welcome-newsletter-template';

const TOKEN_EXPIRY_HOURS = 24;

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly publicBaseUrl =
    process.env.NEWSLETTER_PUBLIC_URL ?? 'https://kadryhr.pl';
  private readonly appCtaUrl =
    process.env.NEWSLETTER_CTA_URL ?? 'https://app.kadryhr.pl/login';

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  private buildConfirmLink(token: string) {
    return `${this.publicBaseUrl}/newsletter/confirm?token=${encodeURIComponent(token)}`;
  }

  private buildUnsubscribeLink(token: string) {
    return `${this.publicBaseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  private async createToken(
    subscriberId: string,
    type: 'newsletter_confirm' | 'newsletter_unsubscribe',
    expiresInHours: number,
  ) {
    const rawToken = this.generateToken();
    const tokenHash = hashToken(rawToken);

    await this.prisma.newsletterToken.create({
      data: {
        subscriberId,
        tokenHash,
        type,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      },
    });

    return rawToken;
  }

  async subscribe(input: {
    email: string;
    name?: string;
    marketingConsent: boolean;
    organisationId?: string | null;
  }) {
    const organisationId = input.organisationId ?? null;
    const existing = await this.prisma.newsletterSubscriber.findFirst({
      where: {
        email: input.email,
        organisationId,
      },
    });

    let subscriber = existing;
    if (existing) {
      subscriber = await this.prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          name: input.name ?? existing.name,
          marketingConsent: input.marketingConsent || existing.marketingConsent,
          status: NewsletterSubscriptionStatus.PENDING_CONFIRMATION,
        },
      });
    } else {
      subscriber = await this.prisma.newsletterSubscriber.create({
        data: {
          email: input.email,
          name: input.name,
          organisationId,
          marketingConsent: input.marketingConsent,
        },
      });
    }

    const recentTokens = await this.prisma.newsletterToken.count({
      where: {
        subscriberId: subscriber.id,
        type: 'newsletter_confirm',
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    if (recentTokens >= 3) {
      throw new TooManyRequestsException(
        'Poczekaj chwilę przed ponownym zamówieniem linku potwierdzającego.',
      );
    }

    const rawToken = await this.createToken(
      subscriber.id,
      'newsletter_confirm',
      TOKEN_EXPIRY_HOURS,
    );

    const confirmLink = this.buildConfirmLink(rawToken);
    await this.queueService.addNewsletterEmailJob({
      to: subscriber.email,
      subject: 'Potwierdź zapis do newslettera KadryHR',
      text: `Dziękujemy za zapis. Kliknij, aby potwierdzić: ${confirmLink}`,
      html: `<p style="font-family:Inter,Arial,sans-serif">Dziękujemy za zapis do newslettera KadryHR.</p><p><a href="${confirmLink}">Potwierdź subskrypcję</a> – link wygaśnie za 24h.</p>`,
    });

    this.logger.log(`Newsletter subscription initiated for ${subscriber.email}`);

    return { success: true };
  }

  async confirm(token: string) {
    const tokenHash = hashToken(token);
    const storedToken = await this.prisma.newsletterToken.findFirst({
      where: { tokenHash, type: 'newsletter_confirm' },
      include: { subscriber: true },
    });

    if (!storedToken) {
      throw new NotFoundException('Token nieprawidłowy.');
    }

    if (storedToken.usedAt) {
      throw new BadRequestException('Token został już użyty.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new BadRequestException('Token wygasł.');
    }

    const subscriber = await this.prisma.newsletterSubscriber.update({
      where: { id: storedToken.subscriberId },
      data: {
        status: NewsletterSubscriptionStatus.ACTIVE,
        confirmedAt: new Date(),
      },
    });

    await this.prisma.newsletterToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    });

    const unsubscribeToken = await this.createToken(
      subscriber.id,
      'newsletter_unsubscribe',
      24 * 365,
    );
    const unsubscribeLink = this.buildUnsubscribeLink(unsubscribeToken);

    const html = buildWelcomeNewsletterHtml({
      unsubscribeUrl: unsubscribeLink,
      ctaUrl: this.appCtaUrl,
    });

    await this.queueService.addNewsletterEmailJob({
      to: subscriber.email,
      subject: 'Witaj w newsletterze KadryHR',
      text: 'Poznaj nowości w KadryHR i planuj grafiki bez chaosu.',
      html,
    });

    return { success: true };
  }

  async unsubscribe(token: string) {
    const tokenHash = hashToken(token);
    const storedToken = await this.prisma.newsletterToken.findFirst({
      where: { tokenHash, type: 'newsletter_unsubscribe' },
      include: { subscriber: true },
    });

    if (!storedToken) {
      throw new NotFoundException('Token nieprawidłowy.');
    }

    if (storedToken.usedAt) {
      throw new BadRequestException('Token został już użyty.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new BadRequestException('Token wygasł.');
    }

    await this.prisma.newsletterSubscriber.update({
      where: { id: storedToken.subscriberId },
      data: {
        status: NewsletterSubscriptionStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });

    await this.prisma.newsletterToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    });

    return { success: true };
  }

  async list(organisationId: string, query: {
    status?: NewsletterSubscriptionStatus;
    from?: Date;
    to?: Date;
    email?: string;
  }) {
    if (!organisationId) {
      throw new ForbiddenException('Brak organizacji');
    }

    const where: Prisma.NewsletterSubscriberWhereInput = {
      organisationId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.email) {
      where.email = { contains: query.email, mode: 'insensitive' };
    }

    if (query.from || query.to) {
      where.subscribedAt = {
        gte: query.from,
        lte: query.to,
      };
    }

    const data = await this.prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
    });

    return { data };
  }
}
