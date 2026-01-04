import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EmailAdapter } from './email.adapter';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailAdapter: EmailAdapter) {}

  @Post('test')
  @Roles(Role.OWNER, Role.ADMIN)
  async sendTest(@Body() dto: SendTestEmailDto) {
    const result = await this.emailAdapter.sendTestEmail(dto.to);

    if (!result.success) {
      throw new BadRequestException(result.error ?? 'Email delivery failed');
    }

    return { success: true };
  }
}
