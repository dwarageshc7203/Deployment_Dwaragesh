import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  password: string | null;

  @Column({ type: 'enum', enum: ['doctor', 'patient'], default: 'patient' })
  role: 'doctor' | 'patient';

  @Column({ type: 'enum', enum: ['local', 'google'], default: 'local' })
  provider: 'local' | 'google';

  @Column({ type: 'text', nullable: true })
  hashed_refresh_token: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patient: Patient;

}
