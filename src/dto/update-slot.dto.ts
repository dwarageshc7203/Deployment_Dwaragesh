// src/dto/update-slot.dto.ts
import { IsOptional, IsString, IsBoolean, IsDateString, IsIn } from 'class-validator';

export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  slot_date?: string;

  @IsOptional()
  @IsString()
  slot_time?: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @IsOptional()
@IsIn(['morning', 'evening'])
session?: 'morning' | 'evening';

}
