import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Timeslot } from './timeslot.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  appointment_id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'date' })
  appointment_date: Date;

// ✅ Use a plain column
@Column({ type: 'time', nullable: false })
time_slot: string;


  @Column({ type: 'enum', enum: ['morning', 'evening'], nullable: true })
  session: 'morning' | 'evening';

  @Column({ type: 'varchar', length: 20 })
  appointment_status: string;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column('text')
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ default: false })
  is_dummy?: boolean;

  @Column({ type: 'time', nullable: true })
  reporting_time: string;
}
