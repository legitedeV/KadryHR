import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { AuthUser } from "../auth/auth.types";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("me")
  getMe(@Req() req: { user: AuthUser }) {
    return this.organizationsService.getMe(req.user.organizationId);
  }

  @Patch("me")
  updateMe(@Req() req: { user: AuthUser }, @Body() body: UpdateOrganizationDto) {
    return this.organizationsService.updateMe(req.user.organizationId, body);
  }
}
