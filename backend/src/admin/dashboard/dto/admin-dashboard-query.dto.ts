import { IsDateString, IsOptional } from 'class-validator';

export class AdminDashboardQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
