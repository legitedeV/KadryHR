import { Injectable, BadRequestException } from '@nestjs/common';
import { LeaveStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaveBalanceInfo {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocated: number;
  used: number;
  adjustment: number;
  remaining: number;
}

@Injectable()
export class LeaveBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get leave balances for a specific employee
   */
  async getEmployeeBalances(
    organisationId: string,
    employeeId: string,
    year?: number,
  ): Promise<LeaveBalanceInfo[]> {
    const targetYear = year ?? new Date().getFullYear();

    // Ensure balances exist for the employee (auto-initialize if needed)
    await this.ensureBalancesForEmployee(
      organisationId,
      employeeId,
      targetYear,
    );

    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        organisationId,
        employeeId,
        year: targetYear,
      },
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: {
        leaveType: { name: 'asc' },
      },
    });

    return balances.map((b) => ({
      employeeId: b.employeeId,
      employeeName:
        `${b.employee.firstName ?? ''} ${b.employee.lastName ?? ''}`.trim() ||
        'Pracownik',
      leaveTypeId: b.leaveTypeId,
      leaveTypeName: b.leaveType.name,
      year: b.year,
      allocated: b.allocated,
      used: b.used,
      adjustment: b.adjustment,
      remaining: b.allocated + b.adjustment - b.used,
    }));
  }

  /**
   * Get leave balances for all employees in the organisation
   */
  async getOrganisationBalances(
    organisationId: string,
    year?: number,
  ): Promise<LeaveBalanceInfo[]> {
    const targetYear = year ?? new Date().getFullYear();

    // Get all employees
    const employees = await this.prisma.employee.findMany({
      where: { organisationId },
      select: { id: true },
    });

    // Ensure balances exist for all employees
    for (const emp of employees) {
      await this.ensureBalancesForEmployee(organisationId, emp.id, targetYear);
    }

    const balances = await this.prisma.leaveBalance.findMany({
      where: {
        organisationId,
        year: targetYear,
      },
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: [
        { employee: { lastName: 'asc' } },
        { employee: { firstName: 'asc' } },
        { leaveType: { name: 'asc' } },
      ],
    });

    return balances.map((b) => ({
      employeeId: b.employeeId,
      employeeName:
        `${b.employee.firstName ?? ''} ${b.employee.lastName ?? ''}`.trim() ||
        'Pracownik',
      leaveTypeId: b.leaveTypeId,
      leaveTypeName: b.leaveType.name,
      year: b.year,
      allocated: b.allocated,
      used: b.used,
      adjustment: b.adjustment,
      remaining: b.allocated + b.adjustment - b.used,
    }));
  }

  /**
   * Validate that an employee has enough leave balance for a request
   */
  async validateBalance(
    organisationId: string,
    employeeId: string,
    leaveTypeId: string | null | undefined,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<{ valid: boolean; message?: string; remaining?: number }> {
    // If no leave type is specified, skip validation
    if (!leaveTypeId) {
      return { valid: true };
    }

    const year = startDate.getFullYear();
    const requestedDays = this.calculateWorkingDays(startDate, endDate);

    // Ensure balances exist
    await this.ensureBalancesForEmployee(organisationId, employeeId, year);

    // Get the balance for this leave type
    const balance = await this.prisma.leaveBalance.findFirst({
      where: {
        organisationId,
        employeeId,
        leaveTypeId,
        year,
      },
    });

    if (!balance) {
      return { valid: true, remaining: 0 };
    }

    // Calculate current used (excluding the request being updated)
    let currentUsed = balance.used;
    if (excludeRequestId) {
      const existingRequest = await this.prisma.leaveRequest.findFirst({
        where: {
          id: excludeRequestId,
          status: LeaveStatus.APPROVED,
          leaveTypeId,
        },
      });
      if (existingRequest) {
        const existingDays = this.calculateWorkingDays(
          existingRequest.startDate,
          existingRequest.endDate,
        );
        currentUsed -= existingDays;
      }
    }

    const remaining = balance.allocated + balance.adjustment - currentUsed;

    if (requestedDays > remaining) {
      return {
        valid: false,
        message: `Niewystarczająca liczba dni urlopu. Dostępne: ${remaining}, wnioskowane: ${requestedDays}`,
        remaining,
      };
    }

    return { valid: true, remaining: remaining - requestedDays };
  }

  /**
   * Update the used balance when a leave request is approved
   */
  async updateUsedBalance(
    organisationId: string,
    employeeId: string,
    leaveTypeId: string,
    startDate: Date,
    endDate: Date,
    operation: 'add' | 'subtract',
  ): Promise<void> {
    const year = startDate.getFullYear();
    const days = this.calculateWorkingDays(startDate, endDate);

    await this.ensureBalancesForEmployee(organisationId, employeeId, year);

    const balance = await this.prisma.leaveBalance.findFirst({
      where: {
        organisationId,
        employeeId,
        leaveTypeId,
        year,
      },
    });

    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used:
            operation === 'add'
              ? balance.used + days
              : Math.max(0, balance.used - days),
        },
      });
    }
  }

  /**
   * Adjust a balance manually (for carry-over, corrections, etc.)
   */
  async adjustBalance(
    organisationId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
    adjustment: number,
    allocated?: number,
  ): Promise<LeaveBalanceInfo> {
    await this.ensureBalancesForEmployee(organisationId, employeeId, year);

    const balance = await this.prisma.leaveBalance.findFirst({
      where: {
        organisationId,
        employeeId,
        leaveTypeId,
        year,
      },
      include: { employee: true, leaveType: true },
    });

    if (!balance) {
      throw new BadRequestException('Balance not found');
    }

    const updated = await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        adjustment,
        ...(allocated !== undefined && { allocated }),
      },
      include: { employee: true, leaveType: true },
    });

    return {
      employeeId: updated.employeeId,
      employeeName:
        `${updated.employee.firstName ?? ''} ${updated.employee.lastName ?? ''}`.trim() ||
        'Pracownik',
      leaveTypeId: updated.leaveTypeId,
      leaveTypeName: updated.leaveType.name,
      year: updated.year,
      allocated: updated.allocated,
      used: updated.used,
      adjustment: updated.adjustment,
      remaining: updated.allocated + updated.adjustment - updated.used,
    };
  }

  /**
   * Ensure leave balances exist for an employee (auto-initialize from leave types)
   */
  private async ensureBalancesForEmployee(
    organisationId: string,
    employeeId: string,
    year: number,
  ): Promise<void> {
    // Get all active leave types for the organisation
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { organisationId, isActive: true },
    });

    for (const leaveType of leaveTypes) {
      // Check if balance already exists
      const existing = await this.prisma.leaveBalance.findFirst({
        where: {
          organisationId,
          employeeId,
          leaveTypeId: leaveType.id,
          year,
        },
      });

      if (!existing) {
        // Create initial balance using defaultDaysPerYear from the leave type
        await this.prisma.leaveBalance.create({
          data: {
            organisationId,
            employeeId,
            leaveTypeId: leaveType.id,
            year,
            allocated: leaveType.defaultDaysPerYear ?? 26, // Default to Polish standard
            used: 0,
            adjustment: 0,
          },
        });
      }
    }
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Skip Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(1, count); // At least 1 day
  }
}
