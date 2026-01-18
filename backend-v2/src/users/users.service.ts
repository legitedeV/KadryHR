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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

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
    });
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

    return user;
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
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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

    return updated;
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

    return updated;
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

    return updated;
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
