import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarsService } from './avatars.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { Permission } from '../auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller()
export class AvatarsController {
  constructor(
    private readonly avatarsService: AvatarsService,
    private readonly prisma: PrismaService,
  ) {}

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post('employees/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({
    action: 'EMPLOYEE_AVATAR_UPLOAD',
    entityType: 'employee',
    entityIdParam: 'id',
  })
  async uploadEmployeeAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new NotFoundException('Nie przesłano pliku');
    }

    // Validate file
    this.avatarsService.validateFile(file.mimetype, file.size);

    // Verify employee exists in user's organisation
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId: user.organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Pracownik nie został znaleziony');
    }

    // Delete old avatar if exists
    if (employee.avatarPath || employee.avatarUrl) {
      await this.avatarsService.deleteAvatar(
        employee.avatarPath ?? employee.avatarUrl ?? '',
      );
    }

    // Save new avatar
    const { avatarPath, avatarUrl } = await this.avatarsService.saveAvatar(
      file.buffer,
      user.organisationId,
      'employees',
      employeeId,
      file.originalname,
    );

    // Update employee record
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { avatarPath, avatarUrl: null },
    });

    return { avatarUrl };
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Delete('employees/:id/avatar')
  @AuditLog({
    action: 'EMPLOYEE_AVATAR_DELETE',
    entityType: 'employee',
    entityIdParam: 'id',
  })
  async deleteEmployeeAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') employeeId: string,
  ) {
    // Verify employee exists in user's organisation
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId: user.organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Pracownik nie został znaleziony');
    }

    // Delete avatar file if exists
    if (employee.avatarPath || employee.avatarUrl) {
      await this.avatarsService.deleteAvatar(
        employee.avatarPath ?? employee.avatarUrl ?? '',
      );
    }

    // Update employee record
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { avatarPath: null, avatarUrl: null },
    });

    return { success: true };
  }

  @Post('organisations/me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({
    action: 'ORGANISATION_LOGO_UPLOAD',
    entityType: 'organisation',
  })
  async uploadOrganisationLogo(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: any,
  ) {
    // Check if user has permission (OWNER or MANAGER)
    if (![Role.OWNER, Role.MANAGER].includes(user.role)) {
      throw new ForbiddenException(
        'Tylko właściciel lub manager może zmienić logo organizacji',
      );
    }

    if (!file) {
      throw new NotFoundException('Nie przesłano pliku');
    }

    // Validate file
    this.avatarsService.validateFile(file.mimetype, file.size);

    // Get organisation
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: user.organisationId },
    });

    if (!organisation) {
      throw new NotFoundException('Organizacja nie została znaleziona');
    }

    // Delete old logo if exists
    if (organisation.logoUrl) {
      await this.avatarsService.deleteAvatar(organisation.logoUrl);
    }

    // Save new logo
    const { avatarUrl: logoUrl } = await this.avatarsService.saveAvatar(
      file.buffer,
      user.organisationId,
      'organisations',
      user.organisationId,
      file.originalname,
    );

    // Update organisation record
    await this.prisma.organisation.update({
      where: { id: user.organisationId },
      data: { logoUrl },
    });

    return { logoUrl };
  }

  @Delete('organisations/me/avatar')
  @AuditLog({
    action: 'ORGANISATION_LOGO_DELETE',
    entityType: 'organisation',
  })
  async deleteOrganisationLogo(@CurrentUser() user: AuthenticatedUser) {
    // Check if user has permission (OWNER or MANAGER)
    if (![Role.OWNER, Role.MANAGER].includes(user.role)) {
      throw new ForbiddenException(
        'Tylko właściciel lub manager może usunąć logo organizacji',
      );
    }

    // Get organisation
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: user.organisationId },
    });

    if (!organisation) {
      throw new NotFoundException('Organizacja nie została znaleziona');
    }

    // Delete logo file if exists
    if (organisation.logoUrl) {
      await this.avatarsService.deleteAvatar(organisation.logoUrl);
    }

    // Update organisation record
    await this.prisma.organisation.update({
      where: { id: user.organisationId },
      data: { logoUrl: null },
    });

    return { success: true };
  }
}
