import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from './types/authenticated-user.type';
import type { StringValue } from 'ms';
import { Response } from 'express';
import { getPermissionsForRole } from './permissions';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { QueueService } from '../queue/queue.service';
import { ShiftPresetsService } from '../shift-presets/shift-presets.service';
import { EmailTemplatesService } from '../email/email-templates.service';
import { createHash, randomBytes } from 'crypto';
import { AvatarsService } from '../avatars/avatars.service';

const PASSWORD_RESET_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_FRONTEND_URL = 'https://kadryhr.pl';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly shiftPresetsService: ShiftPresetsService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly avatarsService: AvatarsService,
  ) {}

  private parseTtlToMs(ttl: string): number {
    const match = ttl.toLowerCase().match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    const [, value, unit] = match;
    const multiplier =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60000
          : unit === 'h'
            ? 3600000
            : 86400000;
    return Number(value) * multiplier;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetLink(token: string) {
    const configuredUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      this.configService.get<string>('APP_FRONTEND_URL') ??
      DEFAULT_FRONTEND_URL;
    let safeUrl = DEFAULT_FRONTEND_URL;
    try {
      const parsed = new URL(configuredUrl);
      const env = this.configService.get<string>('NODE_ENV');
      const allowHttp = env !== 'production';
      if (
        parsed.protocol === 'https:' ||
        (allowHttp && parsed.protocol === 'http:')
      ) {
        safeUrl = parsed.toString();
      }
    } catch {
      safeUrl = DEFAULT_FRONTEND_URL;
    }
    return `${safeUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  }

  private getPasswordResetTtlMs() {
    const configured =
      this.configService.get<string>('app.passwordResetTtlMs') ??
      this.configService.get<string>('APP_PASSWORD_RESET_TTL_MS');
    const parsed = configured ? Number(configured) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return PASSWORD_RESET_TTL_MS;
  }

  private buildUserPayload(user: {
    id: string;
    email: string;
    organisationId: string;
    role: AuthenticatedUser['role'];
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      organisationId: user.organisationId,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    };
  }

  private async buildSafeUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        organisationId: true,
        firstName: true,
        lastName: true,
        avatarPath: true,
        avatarUrl: true,
        updatedAt: true,
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { avatarPath, updatedAt, ...rest } = user;

    return {
      ...rest,
      avatarUrl: this.avatarsService.buildPublicUrl(
        avatarPath ?? null,
        user.avatarUrl ?? null,
      ),
      avatarUpdatedAt: updatedAt ?? null,
      permissions: getPermissionsForRole(user.role),
    };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async ensureEmployeeAccess(userId: string, organisationId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, organisationId },
      select: { isActive: true, isDeleted: true },
    });

    if (!employee) {
      return;
    }

    if (employee.isDeleted) {
      throw new UnauthorizedException('Konto pracownika zostało usunięte.');
    }

    if (!employee.isActive) {
      throw new UnauthorizedException('Konto pracownika jest nieaktywne.');
    }
  }

  private async signTokens(payload: AuthenticatedUser) {
    const secret =
      this.configService.get<string>('app.jwt.secret') ?? 'changeme-access';
    const accessTokenTtl = (this.configService.get<string>(
      'app.jwt.accessTokenTtl',
    ) ?? '15m') as StringValue;

    const refreshSecret =
      this.configService.get<string>('app.refreshTokenSecret') ??
      'changeme-refresh-secret';
    const refreshTokenTtl = (this.configService.get<string>(
      'app.jwt.refreshTokenTtl',
    ) ?? '7d') as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync<AuthenticatedUser>(payload, {
        secret,
        expiresIn: accessTokenTtl,
      }),
      this.jwtService.signAsync<AuthenticatedUser>(payload, {
        secret: refreshSecret,
        expiresIn: refreshTokenTtl,
      }),
    ]);

    return { accessToken, refreshToken, refreshTokenTtl };
  }

  private attachRefreshTokenCookie(
    res: Response,
    token: string,
    ttl: StringValue,
  ) {
    const secure = this.configService.get<string>('NODE_ENV') === 'production';
    const maxAgeMs = this.parseTtlToMs(ttl as string);
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      domain: secure ? '.kadryhr.pl' : undefined,
      maxAge: maxAgeMs || undefined,
      path: '/',
    });
  }

  async createSessionForUser(userId: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.ensureEmployeeAccess(user.id, user.organisationId);
    const payload = this.buildUserPayload(user);
    const { accessToken, refreshToken, refreshTokenTtl } =
      await this.signTokens(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    this.attachRefreshTokenCookie(res, refreshToken, refreshTokenTtl);

    return {
      accessToken,
      user: await this.buildSafeUser(user.id),
    };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.validateUser(email, password);
    await this.ensureEmployeeAccess(user.id, user.organisationId);
    const payload = this.buildUserPayload(user);
    const { accessToken, refreshToken, refreshTokenTtl } =
      await this.signTokens(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    this.attachRefreshTokenCookie(res, refreshToken, refreshTokenTtl);

    return {
      accessToken,
      user: await this.buildSafeUser(user.id),
    };
  }

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Użytkownik z tym e-mailem już istnieje');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let organisation;
    let user;
    try {
      ({ organisation, user } = await this.prisma.$transaction(async (tx) => {
        const organisation = await tx.organisation.create({
          data: {
            name: dto.organisationName,
          },
        });

        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: Role.OWNER,
            firstName: dto.firstName,
            lastName: dto.lastName,
            organisationId: organisation.id,
          },
        });

        await tx.employee.create({
          data: {
            organisationId: organisation.id,
            userId: user.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
          },
        });

        await tx.auditLog.create({
          data: {
            organisationId: organisation.id,
            actorUserId: user.id,
            action: 'owner.registered',
            entityType: 'organisation',
            entityId: organisation.id,
            after: {
              email: dto.email,
              organisationName: dto.organisationName,
            },
          },
        });

        return { organisation, user };
      }));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Użytkownik z tym e-mailem już istnieje');
      }
      throw error;
    }

    const payload = this.buildUserPayload({
      ...user,
      organisationId: organisation.id,
    });
    const { accessToken, refreshToken, refreshTokenTtl } =
      await this.signTokens(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, organisationId: organisation.id },
    });

    this.attachRefreshTokenCookie(res, refreshToken, refreshTokenTtl);

    // Create default shift presets for the new organisation
    await this.shiftPresetsService.createDefaultPresets(organisation.id);

    await this.queueService.addEmailDeliveryJob({
      to: dto.email,
      subject: 'Witamy w KadryHR',
      text: 'Twoje konto właściciela zostało utworzone.',
      html: `<p>Cześć ${dto.firstName},</p><p>Twoja organizacja ${dto.organisationName} została utworzona. Zaloguj się, aby kontynuować.</p>`,
      organisationId: organisation.id,
      userId: user.id,
    });

    return {
      accessToken,
      user: await this.buildSafeUser(user.id),
    };
  }

  async refreshTokens(userPayload: AuthenticatedUser, res: Response) {
    if (!userPayload.refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.id },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const match = await bcrypt.compare(
      userPayload.refreshToken,
      user.refreshTokenHash,
    );
    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.ensureEmployeeAccess(user.id, user.organisationId);

    const payload = this.buildUserPayload(user);
    const { accessToken, refreshToken, refreshTokenTtl } =
      await this.signTokens(payload);

    const newRefreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    this.attachRefreshTokenCookie(res, refreshToken, refreshTokenTtl);

    return {
      accessToken,
      user: await this.buildSafeUser(user.id),
    };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return { success: true };
  }

  async me(userPayload: AuthenticatedUser) {
    return this.buildSafeUser(userPayload.id);
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        organisationId: true,
        firstName: true,
        lastName: true,
        organisation: { select: { name: true } },
      },
    });

    if (!user) {
      return { success: true };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.getPasswordResetTtlMs());

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          organisationId: user.organisationId,
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const recipientName =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined;
    const resetLink = this.buildPasswordResetLink(token);
    const template = this.emailTemplates.passwordResetTemplate({
      organisationName: user.organisation?.name ?? undefined,
      resetLink,
      recipientName,
      expiresIn: '2 godziny',
    });

    await this.queueService.addEmailDeliveryJob({
      to: user.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
      organisationId: user.organisationId,
      userId: user.id,
    });

    return { success: true };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException(
        'Nieprawidłowy lub wygasły token resetu hasła.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
