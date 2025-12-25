import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrgContextDecorator } from '../common/decorators/org-context.decorator';
import { OrgGuard } from '../common/guards/org.guard';
import { JwtPayload } from './auth.types';
import { OrgContext } from '../common/interfaces/request-with-auth.interface';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @RateLimit({ limit: 5, ttlMs: 60_000 })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('me')
  async me(
    @CurrentUser() user: JwtPayload,
    @OrgContextDecorator() orgContext: OrgContext,
  ): Promise<Omit<AuthResponse, 'accessToken'>> {
    return this.authService.getProfile(user.sub, orgContext.orgId);
  }
}
