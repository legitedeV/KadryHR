import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RcpService } from './rcp.service';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ClockDto } from './dto/clock.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { ConfigService } from '@nestjs/config';

@Controller('rcp')
@UseGuards(JwtAuthGuard)
export class RcpController {
  constructor(
    private readonly rcpService: RcpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('qr/generate')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async generateQr(@Body() dto: GenerateQrDto, @Req() req: RequestWithUser) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const result = await this.rcpService.generateQr(
      req.user.id,
      req.user.organisationId,
      dto.locationId,
      frontendUrl,
    );

    return result;
  }

  @Post('clock')
  async clock(@Body() dto: ClockDto, @Req() req: RequestWithUser) {
    const userAgent = req.headers['user-agent'];
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      req.connection.remoteAddress;

    const result = await this.rcpService.clock(
      req.user.id,
      req.user.organisationId,
      dto.token,
      dto.type,
      dto.clientLat,
      dto.clientLng,
      dto.accuracyMeters,
      dto.clientTime ? new Date(dto.clientTime) : undefined,
      userAgent,
      ip,
    );

    return result;
  }

  @Get('status')
  async getStatus(
    @Query('locationId') locationId: string | undefined,
    @Req() req: RequestWithUser,
  ) {
    const result = await this.rcpService.getStatus(
      req.user.id,
      req.user.organisationId,
      locationId,
    );

    return result;
  }
}
