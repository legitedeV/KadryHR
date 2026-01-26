import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ExecutionContext } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

class MockAuthService {
  login = jest.fn().mockResolvedValue({ ok: true });
  refreshTokens = jest.fn().mockResolvedValue({ refreshed: true });
  me = jest.fn().mockResolvedValue({ id: 'user' });
  logout = jest.fn().mockResolvedValue({ success: true });
}

describe('AuthController', () => {
  let controller: AuthController;
  let service: MockAuthService;

  beforeEach(async () => {
    service = new MockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        {
          provide: InvitationsService,
          useValue: { acceptInvitation: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context: ExecutionContext) => true })
      .overrideGuard(JwtRefreshGuard)
      .useValue({ canActivate: (context: ExecutionContext) => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('calls service.login on login', async () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
    await controller.login(
      {
        email: 'test@example.com',
        password: 'password123',
      },
      res,
    );
    expect(service.login).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
      res,
    );
  });

  it('calls service.refreshTokens on refresh', async () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
    await controller.refresh(
      { id: 'user', organisationId: 'org', email: '', role: undefined as any },
      res,
    );
    expect(service.refreshTokens).toHaveBeenCalled();
  });
});
