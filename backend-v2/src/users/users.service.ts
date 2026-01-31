import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { AvatarsService } from '../avatars/avatars.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly avatarsService: AvatarsService,
  ) {}

  private mapUserAvatar<T extends { avatarPath?: string | null; avatarUrl?: string | null }>(
    user: T,
  ): Omit<T, 'avatarPath'> {
    const { avatarPath, ...rest } = user;
    return {
      ...(rest as Omit<T, 'avatarPath'>),
      avatarUrl: this.avatarsService.buildPublicUrl(
        avatarPath ?? null,
        user.avatarUrl ?? null,
      ),
    };
  }

  private buildLoginUrl() {
    const baseUrl =
      this.configService.get<string>('FRONTEND_BASE_URL') ??
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'https://kadryhr.pl';
    return `${baseUrl.replace(/\/$/, '')}/login`;
  }

  async create(
    actorUserId: string,
    organisationId: string,
    dto: CreateUserDto,
  ) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        organisationId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        employee:
          dto.employeeId != null
            ? {
                connect: { id: dto.employeeId },
              }
            : undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organisationId: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'CREATE',
      entityType: 'user',
      entityId: created.id,
      after: {
        email: created.email,
        role: created.role,
        firstName: created.firstName,
        lastName: created.lastName,
      },
    });

    try {
      await this.notificationsService.sendUserCreatedNotification({
        organisationId,
        userId: created.id,
        loginUrl: this.buildLoginUrl(),
        createdByUserId: actorUserId,
      });
    } catch (error) {
      this.logger.warn(
        `Notification for user ${created.id} skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    return created;
  }

  async findAll(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }).then((users) => users.map((user) => this.mapUserAvatar(user)));
  }

  async update(
    actorUserId: string,
    userId: string,
    organisationId: string,
    dto: UpdateUserDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'user',
      entityId: userId,
      before: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      after: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        role: updated.role,
      },
    });

    return updated;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        organisationId: true,
        createdAt: true,
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserAvatar(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const before = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!before) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        organisationId: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId: before.organisationId,
      actorUserId: userId,
      action: 'UPDATE',
      entityType: 'user-profile',
      entityId: userId,
      before: { firstName: before.firstName, lastName: before.lastName },
      after: { firstName: updated.firstName, lastName: updated.lastName },
    });

    return this.mapUserAvatar(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        refreshTokenHash: null, // Invalidate old sessions
      },
    });

    await this.auditService.record({
      organisationId: user.organisationId,
      actorUserId: userId,
      action: 'UPDATE',
      entityType: 'user-password',
      entityId: userId,
      after: { passwordChanged: true },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const oldEmail = user.email;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.newEmail,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        organisationId: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId: user.organisationId,
      actorUserId: userId,
      action: 'UPDATE',
      entityType: 'user-email',
      entityId: userId,
      before: { email: oldEmail },
      after: { email: dto.newEmail },
    });

    return this.mapUserAvatar(updated);
  }

  async updateMemberRole(
    actorUserId: string,
    targetUserId: string,
    organisationId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, organisationId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Prevent changing owner's role
    if (targetUser.role === Role.OWNER) {
      throw new BadRequestException(
        'Cannot change the role of the organisation owner',
      );
    }

    const oldRole = targetUser.role;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'UPDATE',
      entityType: 'user-role',
      entityId: targetUserId,
      before: { role: oldRole },
      after: { role: dto.role },
    });

    return this.mapUserAvatar(updated);
  }

  async uploadProfileAvatar(user: AuthenticatedUser, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nie przesłano pliku');
    }

    this.avatarsService.validateFile(file.mimetype, file.size);

    const existing = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        organisationId: true,
        avatarPath: true,
        avatarUrl: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const pathsToDelete = new Set<string>();
    if (existing.avatarPath || existing.avatarUrl) {
      pathsToDelete.add(existing.avatarPath ?? existing.avatarUrl ?? '');
    }

    const linkedEmployee = await this.prisma.employee.findFirst({
      where: { userId: user.id },
      select: { id: true, avatarPath: true, avatarUrl: true },
    });

    if (linkedEmployee?.avatarPath || linkedEmployee?.avatarUrl) {
      pathsToDelete.add(
        linkedEmployee.avatarPath ?? linkedEmployee.avatarUrl ?? '',
      );
    }

    for (const pathValue of pathsToDelete) {
      if (pathValue) {
        await this.avatarsService.deleteAvatar(pathValue);
      }
    }

    const { avatarPath, avatarUrl } = await this.avatarsService.saveAvatar(
      file.buffer,
      existing.organisationId,
      'users',
      user.id,
      file.originalname,
    );

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        avatarPath,
        avatarUrl: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        avatarPath: true,
        organisationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (linkedEmployee) {
      await this.prisma.employee.update({
        where: { id: linkedEmployee.id },
        data: { avatarPath, avatarUrl: null },
      });
    }

    await this.auditService.record({
      organisationId: updated.organisationId,
      actorUserId: user.id,
      action: 'UPDATE',
      entityType: 'user-profile-avatar',
      entityId: user.id,
      before: { avatarPath: existing.avatarPath ?? existing.avatarUrl },
      after: { avatarPath },
    });

    return {
      avatarUrl,
      avatarUpdatedAt: updated.updatedAt,
      profile: this.mapUserAvatar(updated),
    };
  }

  async delete(actorUserId: string, userId: string, organisationId: string) {
    // Verify user exists and belongs to the same organization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organisationId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting OWNER role
    if (user.role === Role.OWNER) {
      throw new BadRequestException('Cannot delete organization owner');
    }

    // Delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'DELETE',
      entityType: 'user',
      entityId: userId,
      before: {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    return { success: true, message: 'User deleted successfully' };
  }
}
