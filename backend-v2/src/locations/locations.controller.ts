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
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateLocationEmployeesDto } from './dto/update-location-employees.dto';
import { GeocodeLocationDto } from './dto/geocode-location.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.locationsService.findAll(user.organisationId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.locationsService.findOne(user.organisationId, id);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationsService.create(user.organisationId, dto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Patch(':id/employees')
  async updateEmployees(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLocationEmployeesDto,
  ) {
    return this.locationsService.update(user.organisationId, id, dto);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.locationsService.remove(user.organisationId, id);
  }

  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  @Post('geocode')
  async geocode(@Body() dto: GeocodeLocationDto) {
    return this.locationsService.geocodeLocation(dto.lat, dto.lng);
  }
}
