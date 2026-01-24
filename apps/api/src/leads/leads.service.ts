import { Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { CreateLeadDto } from "./dto/create-lead.dto";

@Injectable()
export class LeadsService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(LeadsService.name);

  async createLead(data: CreateLeadDto, metadata: { userAgent?: string; ip?: string }) {
    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        employeesCount: data.employeesCount ?? null,
        message: data.message ?? null,
        source: data.source ?? null,
        userAgent: metadata.userAgent ?? null,
        ip: metadata.ip ?? null,
      },
    });

    this.logger.log({
      event: "lead.created",
      leadId: lead.id,
      source: lead.source,
      email: lead.email,
    });

    return lead;
  }
}
