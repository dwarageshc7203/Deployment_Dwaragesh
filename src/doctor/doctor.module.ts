import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { Timeslot } from 'src/entities/timeslot.entity';
import { DoctorAvailability } from 'src/entities/doctor_availablity.entity';
import { Appointment } from 'src/entities/appointment.entity';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { TimeslotModule } from 'src/timeslot/timeslot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Timeslot, DoctorAvailability, Appointment, ]),
    TimeslotModule
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
