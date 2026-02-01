import { OAuthService } from './oauth.service';

describe('OAuthService', () => {
  const makeService = (overrides?: {
    prisma?: any;
    shiftPresetsService?: any;
  }) => {
    const configService = { get: jest.fn() };
    const prisma = overrides?.prisma ?? { $transaction: jest.fn() };
    const authService = { createSessionForUser: jest.fn() };
    const shiftPresetsService =
      overrides?.shiftPresetsService ?? {
        createDefaultPresets: jest.fn(),
      };

    return new OAuthService(
      configService as any,
      prisma as any,
      authService as any,
      shiftPresetsService as any,
    );
  };

  const profile = {
    providerAccountId: 'google-123',
    email: 'user@example.com',
    emailVerified: true,
    firstName: 'Jan',
    lastName: 'Kowalski',
    avatarUrl: 'https://example.com/avatar.png',
  };

  it('does not create a new organisation for existing email', async () => {
    const tx = {
      oAuthAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'user-1', organisationId: 'org-1' }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'user-1', organisationId: 'org-1' }),
      },
      employee: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
      organisation: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const shiftPresetsService = {
      createDefaultPresets: jest.fn(),
    };

    const service = makeService({ prisma, shiftPresetsService });

    await (service as any).findOrCreateUser('google', profile, 'request-id');

    expect(tx.organisation.create).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalled();
    expect(shiftPresetsService.createDefaultPresets).not.toHaveBeenCalled();
  });

  it('creates a new organisation and owner user for new email', async () => {
    const tx = {
      oAuthAccount: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'user-new', organisationId: 'org-new' }),
      },
      employee: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      organisation: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'org-new' }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const shiftPresetsService = {
      createDefaultPresets: jest.fn(),
    };

    const service = makeService({ prisma, shiftPresetsService });
    const newProfile = {
      ...profile,
      email: 'new@example.com',
      firstName: null,
      lastName: null,
    };

    await (service as any).findOrCreateUser('google', newProfile, 'request-id');

    expect(tx.organisation.create).toHaveBeenCalledWith({
      data: { name: 'Moja firma' },
    });
    expect(tx.user.create).toHaveBeenCalled();
    expect(tx.employee.create).toHaveBeenCalled();
    expect(shiftPresetsService.createDefaultPresets).toHaveBeenCalledWith(
      'org-new',
    );
  });
});
