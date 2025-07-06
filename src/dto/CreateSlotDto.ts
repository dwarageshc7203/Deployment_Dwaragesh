import {
  Matches,
  IsDateString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSlotDto {
  @IsNotEmpty()
@IsDateString({}, { message: 'date must be a valid ISO date (YYYY-MM-DD)' })
  date: string;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time: string;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'patients_per_slot must be at least 1' })
  patients_per_slot: number;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'booking_start_time must be in HH:mm format',
  })
  booking_start_time?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'booking_end_time must be in HH:mm format',
  })
  booking_end_time?: string;
}
