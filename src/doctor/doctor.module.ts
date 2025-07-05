import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { Timeslot } from 'src/entities/timeslot.entity';
import { DoctorAvailability } from 'src/entities/doctor_availablity.entity';
import { Appointment } from 'src/entities/appointment.entity';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Timeslot, DoctorAvailability, Appointment])
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
