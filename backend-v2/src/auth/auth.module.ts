import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AuditModule } from '../audit/audit.module';
import { BootstrapModule } from '../bootstrap/bootstrap.module';
import { AvatarsModule } from '../avatars/avatars.module';
import { EmployeesModule } from '../employees/employees.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { InvitationsService } from './invitations.service';
import { PermissionsService } from './permissions.service';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    forwardRef(() => AvatarsModule),
    forwardRef(() => EmployeesModule),
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
            // ms.StringValue – np. '15m', '1h', '7d'
            expiresIn: (accessTokenTtl ?? '15m') as StringValue,
          },
        };
      },
    }),
    QueueModule,
    ConfigModule,
    AuditModule,
    BootstrapModule,
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
