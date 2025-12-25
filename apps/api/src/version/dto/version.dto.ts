import { ApiProperty } from '@nestjs/swagger';

export class VersionDto {
  @ApiProperty({
    example: '2.0.0',
    description: 'Application version',
  })
  version: string;

  @ApiProperty({
    example: 'v2',
    description: 'API version prefix',
  })
  apiVersion: string;

  @ApiProperty({
    example: 'KadryHR API',
    description: 'Application name',
  })
  name: string;

  @ApiProperty({
    example: 'Modern HR Management System API',
    description: 'Application description',
  })
  description: string;

  @ApiProperty({
    example: 'development',
    description: 'Current environment',
  })
  environment: string;

  @ApiProperty({
    example: 'v22.0.0',
    description: 'Node.js version',
  })
  nodeVersion: string;

  @ApiProperty({
    example: '2025-12-25T00:00:00.000Z',
    description: 'Build date',
  })
  buildDate: Date;
}
