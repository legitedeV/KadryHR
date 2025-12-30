import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
type Role = string;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Partial<Record<keyof PrismaService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as Partial<Record<keyof PrismaService, jest.Mock>>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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

    const result = await service.login('test@example.com', 'password');

    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('throws on invalid credentials', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.login('bad@example.com', 'password'),
    ).rejects.toThrow();
  });
});
