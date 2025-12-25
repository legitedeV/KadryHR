import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckDto } from './dto/health-check.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    type: HealthCheckDto,
  })
  getHealth(): HealthCheckDto {
    return {
      status: 'ok',
      timestamp: new Date(),
      service: 'kadryhr-api-v2',
      version: '2.0.0',
    };
  }
}
