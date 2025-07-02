import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePatientProfileDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  patient_address?: string;

  @IsString()
  @IsOptional()
  emergency_contact?: string;

  @IsString()
  @IsOptional()
  medical_history?: string;
}
