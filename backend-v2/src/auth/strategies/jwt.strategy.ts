import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { getPermissionsForRole } from '../permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwt.secret') ?? 'changeme-access',
    });
  }

  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
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

    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.id, organisationId: user.organisationId },
      select: { isActive: true, isDeleted: true },
    });

    if (employee?.isDeleted) {
      throw new UnauthorizedException('Konto pracownika zostało usunięte.');
    }

    if (employee && !employee.isActive) {
      throw new UnauthorizedException('Konto pracownika jest nieaktywne.');
    }

    return {
      ...user,
      permissions: getPermissionsForRole(user.role),
    };
  }
}
