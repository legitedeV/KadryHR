import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateContractDto) {
    // Verify employee exists and belongs to organisation
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Create contract
    const contract = await this.prisma.employmentContract.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        type: dto.type,
        workTimeType: dto.workTimeType ?? 'FULL_TIME',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        position: dto.position,
        notes: dto.notes,
        status: ContractStatus.ACTIVE,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        compensations: true,
      },
    });

    // If compensation data provided, create it
    if (dto.compensationType && dto.compensationAmount !== undefined) {
      await this.prisma.compensation.create({
        data: {
          organisationId,
          contractId: contract.id,
          type: dto.compensationType,
          amount: dto.compensationAmount,
          effectiveFrom: new Date(dto.startDate),
        },
      });
    }

    return this.findOne(organisationId, contract.id);
  }

  async findAll(organisationId: string, employeeId?: string) {
    const where: any = { organisationId };
    if (employeeId) {
      where.employeeId = employeeId;
    }

    return this.prisma.employmentContract.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        compensations: {
          where: {
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
          },
          orderBy: { effectiveFrom: 'desc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(organisationId: string, id: string) {
    const contract = await this.prisma.employmentContract.findFirst({
      where: { id, organisationId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        compensations: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async update(organisationId: string, id: string, dto: UpdateContractDto) {
    const existing = await this.findOne(organisationId, id);

    const updated = await this.prisma.employmentContract.update({
      where: { id },
      data: {
        type: dto.type ?? existing.type,
        workTimeType: dto.workTimeType ?? existing.workTimeType,
        status: dto.status ?? existing.status,
        startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : existing.endDate,
        position: dto.position ?? existing.position,
        notes: dto.notes ?? existing.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        compensations: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    return updated;
  }

  async remove(organisationId: string, id: string) {
    await this.findOne(organisationId, id);

    await this.prisma.employmentContract.delete({
      where: { id },
    });

    return { success: true };
  }

  async addCompensation(
    organisationId: string,
    contractId: string,
    data: {
      type: 'MONTHLY_SALARY' | 'HOURLY_RATE';
      amount: number;
      effectiveFrom: Date;
      effectiveTo?: Date;
      notes?: string;
    },
  ) {
    // Verify contract exists
    await this.findOne(organisationId, contractId);

    return this.prisma.compensation.create({
      data: {
        organisationId,
        contractId,
        ...data,
      },
    });
  }
}
