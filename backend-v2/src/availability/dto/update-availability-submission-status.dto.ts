import { IsEnum } from 'class-validator';
import { AvailabilitySubmissionStatus } from '@prisma/client';

export class UpdateAvailabilitySubmissionStatusDto {
  @IsEnum(AvailabilitySubmissionStatus)
  status!: AvailabilitySubmissionStatus;
}
