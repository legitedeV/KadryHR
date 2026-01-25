import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { CurrentOrganization } from "../auth/auth.decorators";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("me")
  getMe(@CurrentOrganization() organizationId: string) {
    return this.organizationsService.getMe(organizationId);
  }

  @Patch("me")
  updateMe(@CurrentOrganization() organizationId: string, @Body() body: UpdateOrganizationDto) {
    return this.organizationsService.updateMe(organizationId, body);
  }
}
