import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { LocationsService } from "./locations.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { CurrentOrganization, CurrentUser } from "../auth/auth.decorators";

@Controller("locations")
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  list(@CurrentOrganization() organizationId: string) {
    return this.locationsService.list(organizationId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateLocationDto) {
    return this.locationsService.create(user.organizationId, user.role, body);
  }

  @Get(":id")
  getById(@CurrentOrganization() organizationId: string, @Param("id") id: string) {
    return this.locationsService.getById(organizationId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateLocationDto
  ) {
    return this.locationsService.update(user.organizationId, user.role, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.locationsService.remove(user.organizationId, user.role, id);
  }
}
