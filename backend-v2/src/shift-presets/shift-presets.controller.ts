import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ShiftPresetsService } from './shift-presets.service';
import { CreateShiftPresetDto } from './dto/create-shift-preset.dto';
import { UpdateShiftPresetDto } from './dto/update-shift-preset.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-presets')
export class ShiftPresetsController {
  constructor(private readonly shiftPresetsService: ShiftPresetsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.shiftPresetsService.findAll(user.organisationId);
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShiftPresetDto,
  ) {
    return this.shiftPresetsService.create(user.organisationId, dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateShiftPresetDto,
  ) {
    return this.shiftPresetsService.update(user.organisationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.shiftPresetsService.delete(user.organisationId, id);
  }
}
