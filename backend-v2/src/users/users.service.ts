import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        organisationId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        employee:
          dto.employeeId != null
            ? {
                connect: { id: dto.employeeId },
              }
            : undefined,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organisationId: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async findAll(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, organisationId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }
}
