import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Logger,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { EmployeesService } from './employees.service';
import { OrderEmployeesDto } from './dto/order-employees.dto';
import { EmployeeOrderIdempotencyService } from './employee-order-idempotency.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('org/employees')
export class OrgEmployeesController {
  private readonly logger = new Logger(OrgEmployeesController.name);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly idempotencyService: EmployeeOrderIdempotencyService,
  ) {}

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.findAllForOrganisationOrdering(
      user.organisationId,
    );
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Put('order')
  @HttpCode(200)
  async updateOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OrderEmployeesDto,
    @Req() req: { requestId?: string; headers?: Record<string, string | string[]> },
  ) {
    const requestId = req.requestId;
    const rawHeader = req.headers?.['idempotency-key'];
    const idempotencyKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (idempotencyKey) {
      const payloadHash = this.idempotencyService.hashPayload(
        dto.orderedEmployeeIds ?? [],
      );
      const status = await this.idempotencyService.checkOrSet(
        user.organisationId,
        idempotencyKey,
        payloadHash,
      );

      if (status === 'duplicate') {
        this.logger.log(
          JSON.stringify({
            requestId,
            status: 'deduplicated',
            organisationId: user.organisationId,
          }),
        );
        return { success: true, deduplicated: true, requestId };
      }

      if (status === 'conflict') {
        this.logger.warn(
          JSON.stringify({
            requestId,
            status: 'conflict',
            organisationId: user.organisationId,
          }),
        );
        throw new ConflictException(
          'Idempotency key reused with different payload.',
        );
      }
    }

    try {
      const result = await this.employeesService.updateEmployeeOrdering(
        user.organisationId,
        dto.orderedEmployeeIds ?? [],
        dto.periodId,
      );
      this.logger.log(
        JSON.stringify({
          requestId,
          status: 'success',
          organisationId: user.organisationId,
        }),
      );
      return {
        success: true,
        updatedCount: result.updatedCount,
        requestId,
      };
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          requestId,
          status: 'failed',
          organisationId: user.organisationId,
        }),
      );
      throw error;
    }
  }
}
