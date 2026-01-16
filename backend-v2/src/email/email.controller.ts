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
import { EmailTemplatesService } from './email-templates.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailAdapter: EmailAdapter,
    private readonly emailTemplates: EmailTemplatesService,
  ) {}

  @Post('test')
  @Roles(Role.OWNER, Role.ADMIN)
  async sendTest(@Body() dto: SendTestEmailDto) {
    const template = this.emailTemplates.testNotificationTemplate({
      recipientEmail: dto.to,
    });
    const result = await this.emailAdapter.sendEmail({
      to: dto.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (!result.success) {
      throw new BadRequestException(result.error ?? 'Email delivery failed');
    }

    return { success: true };
  }
}
