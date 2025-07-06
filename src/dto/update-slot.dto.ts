// src/dto/update-slot.dto.ts
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  slot_date?: string;

  @IsOptional()
  @IsString()
  slot_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @IsOptional()
  @IsIn(['morning', 'evening'])
  session?: 'morning' | 'evening';

  @IsOptional()
  @IsInt()
  @Min(1)
  patients_per_slot?: number;

  @IsOptional()
  @IsString()
  booking_start_time?: string;

  @IsOptional()
  @IsString()
  booking_end_time?: string;
}
