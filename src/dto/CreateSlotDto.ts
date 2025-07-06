import { Matches, IsDateString, IsNumber } from 'class-validator';

export class CreateSlotDto {
  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start_time: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end_time: string;

  @IsNumber()
  patients_per_slot: number;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
booking_start_time: string;

@Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
booking_end_time: string;

}
