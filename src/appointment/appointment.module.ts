import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/entities/appointment.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Patient } from 'src/entities/patient.entity';
import { Timeslot } from 'src/entities/timeslot.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, Patient, Timeslot])],
  providers: [AppointmentService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
