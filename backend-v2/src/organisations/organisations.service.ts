import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, data: CreateOrganisationDto) {
    return this.prisma.organisation.create({
      data: {
        ...data,
        users: {
          connect: { id: ownerId },
        },
      },
    });
  }

  async findOne(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  update(organisationId: string, data: UpdateOrganisationDto) {
    return this.prisma.organisation.update({
      where: { id: organisationId },
      data,
    });
  }
}
