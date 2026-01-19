import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ListQueryDto, ListUsersQueryDto } from './dto/list-query.dto';
import { UpdatePlatformConfigDto } from './dto/platform-config.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Get('organisations')
  async listOrganisations(@Query() query: ListQueryDto) {
    return this.adminService.listOrganisations(query);
  }

  @Get('users')
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('config')
  async getPlatformConfig() {
    return this.adminService.getPlatformConfig();
  }

  @Put('config')
  async updatePlatformConfig(@Body() payload: UpdatePlatformConfigDto) {
    return this.adminService.updatePlatformConfig(payload);
  }

  @Get('status')
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }
}
