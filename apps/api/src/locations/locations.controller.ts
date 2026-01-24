import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthUser } from "../auth/auth.types";
import { LocationsService } from "./locations.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Controller("locations")
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  list(@Req() req: { user: AuthUser }) {
    return this.locationsService.list(req.user.organizationId);
  }

  @Post()
  create(@Req() req: { user: AuthUser }, @Body() body: CreateLocationDto) {
    return this.locationsService.create(req.user.organizationId, req.user.role, body);
  }

  @Patch(":id")
  update(
    @Req() req: { user: AuthUser },
    @Param("id") id: string,
    @Body() body: UpdateLocationDto
  ) {
    return this.locationsService.update(req.user.organizationId, req.user.role, id, body);
  }

  @Delete(":id")
  remove(@Req() req: { user: AuthUser }, @Param("id") id: string) {
    return this.locationsService.remove(req.user.organizationId, req.user.role, id);
  }
}
