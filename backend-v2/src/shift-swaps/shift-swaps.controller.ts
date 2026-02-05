import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ShiftSwapsService } from './shift-swaps.service';
import { CreateShiftSwapRequestDto } from './dto/create-shift-swap-request.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shift-swaps')
export class ShiftSwapsController {
  constructor(private readonly shiftSwapsService: ShiftSwapsService) {}

  @RequirePermissions(Permission.SCHEDULE_VIEW)
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftSwapsService.list(user.organisationId, user);
  }

  @RequirePermissions(Permission.SCHEDULE_VIEW)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftSwapRequestDto,
  ) {
    return this.shiftSwapsService.create(user.organisationId, user, dto);
  }
}
