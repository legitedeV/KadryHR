import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftPresetDto } from './dto/create-shift-preset.dto';
import { UpdateShiftPresetDto } from './dto/update-shift-preset.dto';

interface DefaultPreset {
  code: string;
  name: string;
  startMinutes: number;
  endMinutes: number;
  color: string;
  sortOrder: number;
}

const DEFAULT_PRESETS: DefaultPreset[] = [
  {
    code: 'MORNING',
    name: 'Rano',
    startMinutes: 345, // 05:45
    endMinutes: 900, // 15:00
    color: '#22c55e',
    sortOrder: 0,
  },
  {
    code: 'AFTERNOON',
    name: 'Popołudnie',
    startMinutes: 855, // 14:15
    endMinutes: 1395, // 23:15
    color: '#3b82f6',
    sortOrder: 1,
  },
  {
    code: 'DELIVERY',
    name: 'Dostawa',
    startMinutes: 360, // 06:00
    endMinutes: 720, // 12:00
    color: '#f59e0b',
    sortOrder: 2,
  },
  {
    code: 'NIGHT',
    name: 'Nocna',
    startMinutes: 1320, // 22:00
    endMinutes: 360, // 06:00 (next day wrap)
    color: '#8b5cf6',
    sortOrder: 3,
  },
];

@Injectable()
export class ShiftPresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organisationId: string) {
    return this.prisma.shiftPreset.findMany({
      where: { organisationId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(organisationId: string, dto: CreateShiftPresetDto) {
    await this.ensureCodeUnique(organisationId, dto.code);

    return this.prisma.shiftPreset.create({
      data: {
        organisationId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        color: dto.color ?? null,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(organisationId: string, id: string, dto: UpdateShiftPresetDto) {
    const existing = await this.prisma.shiftPreset.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift preset not found');
    }

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      await this.ensureCodeUnique(organisationId, dto.code, id);
    }

    return this.prisma.shiftPreset.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        code: dto.code ? dto.code.toUpperCase() : existing.code,
        startMinutes: dto.startMinutes ?? existing.startMinutes,
        endMinutes: dto.endMinutes ?? existing.endMinutes,
        color: dto.color !== undefined ? dto.color : existing.color,
        isDefault: dto.isDefault ?? existing.isDefault,
        isActive: dto.isActive ?? existing.isActive,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
      },
    });
  }

  async delete(organisationId: string, id: string) {
    const existing = await this.prisma.shiftPreset.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift preset not found');
    }

    // Soft delete by setting isActive = false
    await this.prisma.shiftPreset.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  async createDefaultPresets(organisationId: string) {
    const existing = await this.prisma.shiftPreset.count({
      where: { organisationId },
    });

    // Only create defaults if none exist
    if (existing > 0) {
      return [];
    }

    const presets = await this.prisma.shiftPreset.createMany({
      data: DEFAULT_PRESETS.map((preset) => ({
        organisationId,
        code: preset.code,
        name: preset.name,
        startMinutes: preset.startMinutes,
        endMinutes: preset.endMinutes,
        color: preset.color,
        isDefault: true,
        isActive: true,
        sortOrder: preset.sortOrder,
      })),
    });

    return presets;
  }

  private async ensureCodeUnique(
    organisationId: string,
    code: string,
    ignoreId?: string,
  ) {
    const normalizedCode = code.toUpperCase();
    const existing = await this.prisma.shiftPreset.findFirst({
      where: {
        organisationId,
        code: normalizedCode,
        id: ignoreId ? { not: ignoreId } : undefined,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Shift preset with this code already exists',
      );
    }
  }
}
