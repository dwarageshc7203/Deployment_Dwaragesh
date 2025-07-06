// src/entities/timeslot.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor_availablity.entity';
import { Appointment } from './appointment.entity';

// ✅ Move this OUTSIDE the class
export type SessionType = 'morning' | 'evening';

@Entity()
export class Timeslot {
  @PrimaryGeneratedColumn()
  slot_id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.timeslots)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => DoctorAvailability, (availability) => availability.slots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'availability_id' })
  availability: DoctorAvailability;

  @Column({ type: 'date' })
  slot_date: Date;

  @Column({ type: 'time' })
  slot_time: string;

  @Column({ default: true })
  is_available: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.time_slot)
  appointments: Appointment[];

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ type: 'int', nullable: true })
  patients_per_slot: number;

  @Column({ type: 'timestamp', nullable: true })
  booking_start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  booking_end_time: Date;

  @Column({ type: 'int', nullable: true })
  slot_duration: number;

  @Column({ type: 'int', nullable: true })
  reporting_gap: number;

  // ✅ Fixed: Use the declared type correctly
  @Column({ type: 'enum', enum: ['morning', 'evening'], nullable: true })
  session: SessionType;
}
