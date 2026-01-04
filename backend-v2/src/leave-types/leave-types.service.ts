import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private readonly prisma: PrismaService) {}

  list(organisationId: string) {
    return this.prisma.leaveType.findMany({
      where: { organisationId },
      orderBy: { name: 'asc' },
    });
  }

  async create(organisationId: string, dto: CreateLeaveTypeDto) {
    await this.ensureNameUnique(organisationId, dto.name);
    return this.prisma.leaveType.create({
      data: {
        organisationId,
        name: dto.name,
        code: dto.code ?? LeaveCategory.OTHER,
        isPaid: dto.isPaid ?? true,
        color: dto.color ?? null,
      },
    });
  }

  async update(organisationId: string, id: string, dto: UpdateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { id, organisationId },
    });
    if (!existing) {
      throw new NotFoundException('Leave type not found');
    }

    if (dto.name && dto.name !== existing.name) {
      await this.ensureNameUnique(organisationId, dto.name, id);
    }

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        code: dto.code ?? existing.code,
        isPaid: dto.isPaid ?? existing.isPaid,
        color: dto.color ?? existing.color,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  private async ensureNameUnique(
    organisationId: string,
    name: string,
    ignoreId?: string,
  ) {
    const existing = await this.prisma.leaveType.findFirst({
      where: {
        organisationId,
        name,
        id: ignoreId ? { not: ignoreId } : undefined,
      },
    });
    if (existing) {
      throw new BadRequestException('Leave type with this name already exists');
    }
  }
}
