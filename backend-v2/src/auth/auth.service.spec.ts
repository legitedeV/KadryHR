import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { QueueService } from '../queue/queue.service';
import { ShiftPresetsService } from '../shift-presets/shift-presets.service';
import { EmailTemplatesService } from '../email/email-templates.service';
import { AvatarsService } from '../avatars/avatars.service';
type Role = string;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Partial<Record<keyof PrismaService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let queueService: { addEmailDeliveryJob: jest.Mock };
  let shiftPresetsService: { createDefaultPresets: jest.Mock };
  let emailTemplates: { passwordResetTemplate: jest.Mock };
  let avatarsService: { getInitials: jest.Mock; generateAvatarUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      organisation: {
        create: jest.fn(),
      },
      employee: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    } as unknown as Partial<Record<keyof PrismaService, jest.Mock>>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
    };

    queueService = { addEmailDeliveryJob: jest.fn() };

    shiftPresetsService = {
      createDefaultPresets: jest.fn().mockResolvedValue(undefined),
    };

    emailTemplates = {
      passwordResetTemplate: jest.fn().mockReturnValue({
        subject: 'Reset',
        text: 'Reset',
        html: '<p>Reset</p>',
      }),
    };
    avatarsService = {
      getInitials: jest.fn().mockReturnValue('AA'),
      generateAvatarUrl: jest.fn().mockReturnValue('/static/avatar.png'),
      buildPublicUrl: jest.fn().mockReturnValue('/static/avatar.png'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        { provide: QueueService, useValue: queueService },
        { provide: ShiftPresetsService, useValue: shiftPresetsService },
        { provide: EmailTemplatesService, useValue: emailTemplates },
        { provide: AvatarsService, useValue: avatarsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma.$transaction = jest.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb({
          organisation: { create: prisma.organisation.create },
          user: { create: prisma.user.create },
          employee: { create: prisma.employee.create },
          auditLog: { create: prisma.auditLog.create },
        });
      }
      return Array.isArray(cb) ? Promise.all(cb) : cb;
    });
  });

  it('returns tokens on successful login', async () => {
    const password = await bcrypt.hash('password', 10);
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      passwordHash: password,
      organisationId: 'org-id',
      role: 'OWNER' as Role,
    });

    prisma.user.update = jest.fn().mockResolvedValue(undefined);

    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    const result = await service.login('test@example.com', 'password', res);

    expect(result.accessToken).toBe('token');
    expect(result.user).toBeDefined();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
  });

  it('throws on invalid credentials', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.login('bad@example.com', 'password', {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any),
    ).rejects.toThrow();
  });

  it('registers a new organisation owner', async () => {
    prisma.user.findUnique = jest.fn();
    prisma.organisation.create = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', name: 'Org' });
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      role: 'OWNER' as Role,
      organisationId: 'org-1',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      role: 'OWNER' as Role,
      organisationId: 'org-1',
      organisation: { id: 'org-1', name: 'Org' },
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
    prisma.employee.create = jest.fn().mockResolvedValue({});
    prisma.user.update = jest.fn();
    queueService.addEmailDeliveryJob = jest.fn();

    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    const result = await service.register(
      {
        organisationName: 'Org',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'new@example.com',
        password: 'password123',
      },
      res,
    );

    expect(prisma.organisation.create).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'OWNER' }),
      }),
    );
    expect(prisma.employee.create).toHaveBeenCalled();
    expect(result.accessToken).toBeDefined();
    expect(res.cookie).toHaveBeenCalled();
    expect(queueService.addEmailDeliveryJob).toHaveBeenCalled();
  });
});
