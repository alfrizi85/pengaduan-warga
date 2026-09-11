import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'RESOLVED'
  | 'REJECTED';

export class UpdateComplaintStatusDto {
  @IsIn([
    'SUBMITTED',
    'PROCESSING',
    'RESOLVED',
    'REJECTED',
  ])
  status: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
