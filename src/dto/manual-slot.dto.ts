import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateManualSlotDto {
  @IsString()
  date: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsInt()
  @Min(1)
  patients_per_slot: number;

  @IsOptional()
  @IsString()
  session?: string;
}
