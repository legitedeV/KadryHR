import { Controller, Get } from '@nestjs/common';
import { PlatformConfigService } from './platform-config.service';

@Controller('config')
export class PlatformConfigController {
  constructor(private readonly platformConfigService: PlatformConfigService) {}

  @Get('frontend')
  async getFrontendConfig() {
    return this.platformConfigService.getFrontendConfig();
  }
}
