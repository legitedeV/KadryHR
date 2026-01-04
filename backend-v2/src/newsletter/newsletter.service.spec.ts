import { NewsletterService } from './newsletter.service';
import { NewsletterSubscriptionStatus } from '@prisma/client';
import { createHash } from 'crypto';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

describe('NewsletterService', () => {
  let service: NewsletterService;
  const prisma = {
    newsletterSubscriber: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    newsletterToken: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const queueService = {
    addNewsletterEmailJob: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    queueService.addNewsletterEmailJob = jest
      .fn()
      .mockResolvedValue(true);
    service = new NewsletterService(prisma, queueService);
  });

  it('subscribes a new address and enqueues confirmation', async () => {
    prisma.newsletterSubscriber.findFirst.mockResolvedValue(null);
    prisma.newsletterSubscriber.create.mockResolvedValue({
      id: 'sub-1',
      email: 'test@example.com',
    });
    prisma.newsletterToken.count.mockResolvedValue(0);
    prisma.newsletterToken.create.mockResolvedValue({});

    const result = await service.subscribe({
      email: 'test@example.com',
      name: 'Tester',
      marketingConsent: true,
    });

    expect(result).toEqual({ success: true });
    expect(queueService.addNewsletterEmailJob).toHaveBeenCalled();
  });

  it('confirms a valid token and sends welcome email', async () => {
    const rawToken = 'confirm-token';
    prisma.newsletterToken.findFirst.mockResolvedValue({
      id: 'tok-1',
      subscriberId: 'sub-1',
      tokenHash: hashToken(rawToken),
      type: 'newsletter_confirm',
      expiresAt: new Date(Date.now() + 10000),
      subscriber: { id: 'sub-1', email: 'user@example.com' },
    });
    prisma.newsletterSubscriber.update.mockResolvedValue({
      id: 'sub-1',
      email: 'user@example.com',
    });
    prisma.newsletterToken.update.mockResolvedValue({});
    prisma.newsletterToken.create.mockResolvedValue({});

    const result = await service.confirm(rawToken);

    expect(result).toEqual({ success: true });
    expect(
      prisma.newsletterSubscriber.update.mock.calls[0][0].data.status,
    ).toBe(NewsletterSubscriptionStatus.ACTIVE);
    expect(queueService.addNewsletterEmailJob).toHaveBeenCalled();
  });
});
