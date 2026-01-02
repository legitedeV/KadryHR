import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

const refreshTokenExtractor = ExtractJwt.fromExtractors([
  (req: Request) => req.cookies?.refreshToken,
  ExtractJwt.fromBodyField('refreshToken'),
]);

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: refreshTokenExtractor,
      secretOrKey:
        configService.get<string>('app.refreshTokenSecret') ??
        'changeme-refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AuthenticatedUser) {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        organisationId: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { ...user, refreshToken };
  }
}
