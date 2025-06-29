import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  doctor_id: number;

  @IsNotEmpty()
  @IsDateString()
  slot_date: string;  // ✅ renamed from `date`

  @IsNotEmpty()
  slot_time: string;  // ✅ renamed from `start_time`

  end_time?: string;
  session?: 'morning' | 'evening';
  reason?: string;
  notes?: string;
}
