import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaveRequestStatusDto {
  @IsIn(['APPROVED', 'REJECTED', 'CANCELLED'])
  status!: 'APPROVED' | 'REJECTED' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  note?: string;
}
