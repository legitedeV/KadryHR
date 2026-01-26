import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { PermissionsService } from '../auth/permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // Profile endpoints (any authenticated user)
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('profile/change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('profile/change-email')
  async changeEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.usersService.changeEmail(user.id, dto);
  }

  /**
   * Get all available roles with descriptions for UI display
   */
  @Get('roles')
  getRoleDescriptions() {
    return this.permissionsService.getRoleDescriptions();
  }

  // User management endpoints (OWNER, MANAGER only)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.organisationId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(user.id, user.organisationId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, id, user.organisationId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @Patch(':id/role')
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    // Validate role change is allowed
    const check = this.permissionsService.canChangeUserRole(user, id, dto.role);
    if (!check.allowed) {
      throw new BadRequestException(check.reason);
    }

    return this.usersService.updateMemberRole(
      user.id,
      id,
      user.organisationId,
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    // Prevent owner from deleting themselves
    if (user.id === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    return this.usersService.delete(user.id, id, user.organisationId);
  }
}
