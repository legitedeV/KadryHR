import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { QueueModule } from '../queue/queue.module';
import { InvitationsService } from './invitations.service';
import { PermissionsService } from './permissions.service';
import { AuditModule } from '../audit/audit.module';
import { ShiftPresetsModule } from '../shift-presets/shift-presets.module';
import { OAuthService } from './oauth.service';
import { AvatarsModule } from '../avatars/avatars.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => {
        const secret = configService.get<string>('app.jwt.secret');
        const accessTokenTtl = configService.get<string>(
          'app.jwt.accessTokenTtl',
        );

        return {
          secret: secret ?? 'changeme-access',
          signOptions: {
            expiresIn: (accessTokenTtl ?? '15m') as StringValue,
          },
        };
      },
    }),
    QueueModule,
    ConfigModule,
    AuditModule,
    ShiftPresetsModule,
    AvatarsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    InvitationsService,
    PermissionsService,
    OAuthService,
  ],
  exports: [AuthService, InvitationsService, PermissionsService],
})
export class AuthModule {}
