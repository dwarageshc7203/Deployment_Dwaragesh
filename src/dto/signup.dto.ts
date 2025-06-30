export class SignupDto {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: 'doctor' | 'patient';

  // Patient-specific fields
  phone_number: string;
  gender: string;
  dob: Date;
  patient_address: string;
  emergency_contact: string;

  // Doctor-specific (optional)
  specialization?: string;
  education?: string;
  experience?: number;
  clinic_name?: string;
  clinic_address?: string;
  available_days?: string;
  available_time_slots?: string;
}
