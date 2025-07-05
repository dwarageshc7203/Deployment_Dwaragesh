import { IsDateString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  doctor_id: number;

  @IsNotEmpty()
  slot_id: number; // This must be the ID of the selected Timeslot

  @IsNotEmpty()
  @IsDateString()
  slot_date: string;  // Used only for validation and reporting_time logic

  @IsNotEmpty()
  slot_time: string;  // Used only for validation and reporting_time logic

  @IsOptional()
  @IsIn(['morning', 'evening'])
  session?: 'morning' | 'evening';

  @IsOptional()
  reason?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  end_time?: string;
}
