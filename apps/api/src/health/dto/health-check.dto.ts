import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({
    example: 'ok',
    description: 'Health status of the API',
  })
  status: string;

  @ApiProperty({
    example: '2025-12-25T10:00:00.000Z',
    description: 'Current timestamp',
  })
  timestamp: Date;

  @ApiProperty({
    example: 'kadryhr-api-v2',
    description: 'Service name',
  })
  service: string;

  @ApiProperty({
    example: '2.0.0',
    description: 'API version',
  })
  version: string;
}
