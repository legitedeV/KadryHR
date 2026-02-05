import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateShiftSwapRequestDto } from './dto/create-shift-swap-request.dto';

@Injectable()
export class ShiftSwapsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async create(
    organisationId: string,
    user: AuthenticatedUser,
    dto: CreateShiftSwapRequestDto,
  ) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, organisationId },
      include: { employee: true },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const targetEmployee = await this.prisma.employee.findFirst({
      where: {
        id: dto.targetEmployeeId,
        organisationId,
        isDeleted: false,
      },
    });

    if (!targetEmployee) {
      throw new NotFoundException('Target employee not found');
    }

    if (targetEmployee.id === shift.employeeId) {
      throw new BadRequestException('Target employee must be different');
    }

    let requesterId = shift.employeeId;

    if (user.role === Role.EMPLOYEE) {
      const employee = await this.employeesService.findByUser(
        organisationId,
        user.id,
      );

      if (!employee) {
        throw new NotFoundException('Employee profile not found');
      }

      if (employee.id !== shift.employeeId) {
        throw new ForbiddenException('You can only request swaps for your own shifts');
      }

      requesterId = employee.id;
    }

    const targetDate = new Date(dto.targetDate);
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid targetDate');
    }

    return this.prisma.shiftSwapRequest.create({
      data: {
        organisationId,
        requesterId,
        shiftId: shift.id,
        targetEmployeeId: targetEmployee.id,
        targetDate,
        note: dto.note ?? null,
      },
      include: {
        shift: true,
        requester: true,
        targetEmployee: true,
      },
    });
  }

  async list(organisationId: string, user: AuthenticatedUser) {
    const where: { organisationId: string; requesterId?: string } = {
      organisationId,
    };

    if (user.role === Role.EMPLOYEE) {
      const employee = await this.employeesService.findByUser(
        organisationId,
        user.id,
      );

      if (!employee) {
        return [];
      }

      where.requesterId = employee.id;
    }

    return this.prisma.shiftSwapRequest.findMany({
      where,
      include: {
        shift: true,
        requester: true,
        targetEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
