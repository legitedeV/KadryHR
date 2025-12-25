import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VersionDto } from './dto/version.dto';

@ApiTags('version')
@Controller('version')
export class VersionController {
  @Get()
  @ApiOperation({ summary: 'Get API version information' })
  @ApiResponse({
    status: 200,
    description: 'Version information',
    type: VersionDto,
  })
  getVersion(): VersionDto {
    return {
      version: '2.0.0',
      apiVersion: 'v2',
      name: 'KadryHR API',
      description: 'Modern HR Management System API',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      buildDate: new Date('2025-12-25'),
    };
  }
}
