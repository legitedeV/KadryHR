import { PartialType } from '@nestjs/mapped-types';
import { Weekday } from '@prisma/client';
import { CreateAvailabilityDto } from './create-availability.dto';

export class UpdateAvailabilityDto extends PartialType(CreateAvailabilityDto) {
  employeeId?: string;
  date?: string;
  weekday?: Weekday;
  startMinutes?: number;
  endMinutes?: number;
  notes?: string;
}
