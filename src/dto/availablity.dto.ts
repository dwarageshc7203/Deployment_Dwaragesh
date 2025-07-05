// dto/availablity.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityDto {
  @IsString()
  date: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsString()
  session?: string;

  @IsOptional()
  @IsString()
  weekday?: string;

  @IsOptional()
  @IsString()
  booking_start_time?: string;

  @IsOptional()
  @IsString()
  booking_end_time?: string;
}
