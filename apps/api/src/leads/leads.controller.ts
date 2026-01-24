import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { LeadsService } from "./leads.service";

@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async createLead(@Body() body: CreateLeadDto, @Req() request: Request) {
    const userAgent = request.headers["user-agent"];
    const ip = request.ip;

    await this.leadsService.createLead(body, { userAgent, ip });
    return { status: "ok" };
  }
}
