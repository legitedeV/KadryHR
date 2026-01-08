import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { Permission } from '../auth/permissions';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.contractsService.findAll(user.organisationId, employeeId);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(user.organisationId, id);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post()
  @AuditLog({
    action: 'CONTRACT_CREATE',
    entityType: 'contract',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(user.organisationId, dto);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Patch(':id')
  @AuditLog({
    action: 'CONTRACT_UPDATE',
    entityType: 'contract',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(user.organisationId, id, dto);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Delete(':id')
  @AuditLog({
    action: 'CONTRACT_DELETE',
    entityType: 'contract',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.contractsService.remove(user.organisationId, id);
  }
}
