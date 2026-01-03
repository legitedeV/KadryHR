import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    // prosto: wszystko z danej organizacji, bez query paramów
    return this.availabilityService.findAll(user.organisationId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post()
  @AuditLog({
    action: 'AVAILABILITY_CREATE',
    entityType: 'availability',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(user.organisationId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Patch(':id')
  @AuditLog({
    action: 'AVAILABILITY_UPDATE',
    entityType: 'availability',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Delete(':id')
  @AuditLog({
    action: 'AVAILABILITY_DELETE',
    entityType: 'availability',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.availabilityService.remove(user.organisationId, id);
  }
}
