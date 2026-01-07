import { PartialType } from '@nestjs/mapped-types';
import { CreateAvailabilityWindowDto } from './create-availability-window.dto';

export class UpdateAvailabilityWindowDto extends PartialType(
  CreateAvailabilityWindowDto,
) {}
