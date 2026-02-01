import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Permission } from '../auth/permissions';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { EmployeeContractsService } from './employee-contracts.service';
import { CreateEmployeeContractDto } from './dto/create-employee-contract.dto';
import { UpdateEmployeeContractDto } from './dto/update-employee-contract.dto';
import { TerminateEmployeeContractDto } from './dto/terminate-employee-contract.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('employees/:employeeId/contracts')
export class EmployeeContractsController {
  constructor(private readonly contractsService: EmployeeContractsService) {}

  @RequirePermissions(Permission.EMPLOYEE_VIEW)
  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
  ) {
    return this.contractsService.getContractsForEmployee(
      user.organisationId,
      employeeId,
    );
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post()
  @AuditLog({
    action: 'EMPLOYEE_CONTRACT_CREATE',
    entityType: 'employee_contract',
    captureBody: true,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEmployeeContractDto,
  ) {
    return this.contractsService.createContract(
      user.organisationId,
      employeeId,
      dto,
    );
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Patch(':id')
  @AuditLog({
    action: 'EMPLOYEE_CONTRACT_UPDATE',
    entityType: 'employee_contract',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeContractDto,
  ) {
    return this.contractsService.updateContract(
      user.organisationId,
      employeeId,
      id,
      dto,
    );
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post(':id/terminate')
  @AuditLog({
    action: 'EMPLOYEE_CONTRACT_TERMINATE',
    entityType: 'employee_contract',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async terminate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: TerminateEmployeeContractDto,
  ) {
    return this.contractsService.terminateContract(
      user.organisationId,
      employeeId,
      id,
      dto,
    );
  }
}
