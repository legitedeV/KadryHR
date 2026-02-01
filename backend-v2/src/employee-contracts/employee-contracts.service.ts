import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompensationType,
  ContractStatus,
  ContractType,
  EmploymentContract,
} from '@prisma/client';
import { CreateEmployeeContractDto } from './dto/create-employee-contract.dto';
import { UpdateEmployeeContractDto } from './dto/update-employee-contract.dto';
import { TerminateEmployeeContractDto } from './dto/terminate-employee-contract.dto';

const RATE_TYPE = 'HOURLY' as const;

type ContractRateInfo = {
  rateType: typeof RATE_TYPE;
  hourlyRate: number | null;
  currency: string | null;
};

@Injectable()
export class EmployeeContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureEmployeeExists(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      select: { id: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
  }

  private mapContract(
    contract: EmploymentContract & {
      compensations?: Array<{
        type: CompensationType;
        amount: number;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
      }>;
    },
  ) {
    const compensation = contract.compensations?.find(
      (entry) => entry.type === CompensationType.HOURLY_RATE,
    );

    const rateInfo: ContractRateInfo = {
      rateType: RATE_TYPE,
      hourlyRate: compensation?.amount ?? null,
      currency: compensation?.currency ?? null,
    };

    return {
      id: contract.id,
      contractType: contract.type,
      status: contract.status,
      validFrom: contract.startDate,
      validTo: contract.endDate,
      ...rateInfo,
    };
  }

  async getContractsForEmployee(organisationId: string, employeeId: string) {
    await this.ensureEmployeeExists(organisationId, employeeId);

    const contracts = await this.prisma.employmentContract.findMany({
      where: { organisationId, employeeId },
      orderBy: { startDate: 'desc' },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    return contracts.map((contract) => this.mapContract(contract));
  }

  async getActiveContractForEmployee(
    employeeId: string,
    organisationId: string,
    at: Date,
  ) {
    const contract = await this.prisma.employmentContract.findFirst({
      where: {
        organisationId,
        employeeId,
        status: ContractStatus.ACTIVE,
        startDate: { lte: at },
        OR: [{ endDate: null }, { endDate: { gte: at } }],
      },
      orderBy: { startDate: 'desc' },
    });

    if (!contract) {
      return null;
    }

    const compensation = await this.prisma.compensation.findFirst({
      where: {
        contractId: contract.id,
        type: CompensationType.HOURLY_RATE,
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return {
      ...contract,
      compensation,
    };
  }

  async createContract(
    organisationId: string,
    employeeId: string,
    dto: CreateEmployeeContractDto,
  ) {
    await this.ensureEmployeeExists(organisationId, employeeId);
    const validFrom = new Date(dto.validFrom);
    const validTo = dto.validTo ? new Date(dto.validTo) : null;

    return this.prisma.$transaction(async (tx) => {
      const activeContract = await tx.employmentContract.findFirst({
        where: {
          organisationId,
          employeeId,
          status: ContractStatus.ACTIVE,
          OR: [{ endDate: null }, { endDate: { gte: validFrom } }],
        },
        orderBy: { startDate: 'desc' },
      });

      if (activeContract) {
        await tx.employmentContract.update({
          where: { id: activeContract.id },
          data: {
            status: ContractStatus.ENDED,
            endDate: validFrom,
          },
        });

        await tx.compensation.updateMany({
          where: {
            contractId: activeContract.id,
            type: CompensationType.HOURLY_RATE,
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: validFrom } }],
          },
          data: { effectiveTo: validFrom },
        });
      }

      const contract = await tx.employmentContract.create({
        data: {
          organisationId,
          employeeId,
          type: dto.contractType as ContractType,
          status: ContractStatus.ACTIVE,
          workTimeType: 'FULL_TIME',
          startDate: validFrom,
          endDate: validTo,
        },
      });

      await tx.compensation.create({
        data: {
          organisationId,
          contractId: contract.id,
          type: CompensationType.HOURLY_RATE,
          amount: dto.hourlyRate,
          currency: dto.currency ?? 'PLN',
          effectiveFrom: validFrom,
          effectiveTo: validTo,
        },
      });

      const contractWithRate = await tx.employmentContract.findFirst({
        where: { id: contract.id },
        include: {
          compensations: {
            where: { type: CompensationType.HOURLY_RATE },
            orderBy: { effectiveFrom: 'desc' },
            take: 1,
          },
        },
      });

      if (!contractWithRate) {
        throw new NotFoundException('Contract not found');
      }

      return this.mapContract(contractWithRate);
    });
  }

  async updateContract(
    organisationId: string,
    employeeId: string,
    contractId: string,
    dto: UpdateEmployeeContractDto,
  ) {
    await this.ensureEmployeeExists(organisationId, employeeId);

    const contract = await this.prisma.employmentContract.findFirst({
      where: { id: contractId, organisationId, employeeId },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const nextStart = dto.validFrom ? new Date(dto.validFrom) : contract.startDate;
    const nextEnd =
      dto.validTo !== undefined
        ? dto.validTo
          ? new Date(dto.validTo)
          : null
        : contract.endDate;

    const updated = await this.prisma.employmentContract.update({
      where: { id: contractId },
      data: {
        type: dto.contractType ?? contract.type,
        status: dto.status ?? contract.status,
        startDate: nextStart,
        endDate: nextEnd,
      },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (dto.hourlyRate !== undefined || dto.currency || dto.validFrom || dto.validTo !== undefined) {
      const existingCompensation = contract.compensations?.[0];
      if (existingCompensation) {
        await this.prisma.compensation.update({
          where: { id: existingCompensation.id },
          data: {
            amount: dto.hourlyRate ?? existingCompensation.amount,
            currency: dto.currency ?? existingCompensation.currency,
            effectiveFrom: nextStart,
            effectiveTo: nextEnd,
          },
        });
      } else if (dto.hourlyRate !== undefined) {
        await this.prisma.compensation.create({
          data: {
            organisationId,
            contractId,
            type: CompensationType.HOURLY_RATE,
            amount: dto.hourlyRate,
            currency: dto.currency ?? 'PLN',
            effectiveFrom: nextStart,
            effectiveTo: nextEnd,
          },
        });
      }
    }

    const refreshed = await this.prisma.employmentContract.findFirst({
      where: { id: contractId },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!refreshed) {
      throw new NotFoundException('Contract not found');
    }

    return this.mapContract(refreshed);
  }

  async terminateContract(
    organisationId: string,
    employeeId: string,
    contractId: string,
    dto: TerminateEmployeeContractDto,
  ) {
    await this.ensureEmployeeExists(organisationId, employeeId);

    const contract = await this.prisma.employmentContract.findFirst({
      where: { id: contractId, organisationId, employeeId },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const terminatedAt = dto.terminatedAt
      ? new Date(dto.terminatedAt)
      : new Date();

    await this.prisma.employmentContract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.ENDED,
        endDate: terminatedAt,
      },
    });

    await this.prisma.compensation.updateMany({
      where: {
        contractId,
        type: CompensationType.HOURLY_RATE,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: terminatedAt } }],
      },
      data: { effectiveTo: terminatedAt },
    });

    const refreshed = await this.prisma.employmentContract.findFirst({
      where: { id: contractId },
      include: {
        compensations: {
          where: { type: CompensationType.HOURLY_RATE },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!refreshed) {
      throw new NotFoundException('Contract not found');
    }

    return this.mapContract(refreshed);
  }
}
