import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthUser } from "./auth.types";
import { CurrentUser } from "./auth.decorators";
import { SwitchOrganizationDto } from "./dto/switch-organization.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.userId, user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("switch-organization")
  switchOrganization(@CurrentUser() user: AuthUser, @Body() body: SwitchOrganizationDto) {
    return this.authService.switchOrganization(user.userId, body.organizationId);
  }
}
