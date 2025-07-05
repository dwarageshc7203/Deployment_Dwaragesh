import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timeslot } from 'src/entities/timeslot.entity';
import { Appointment } from 'src/entities/appointment.entity';
import { TimeslotService } from './timeslot.service';
import { TimeslotController } from './timeslot.controller';
import { Doctor } from 'src/entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Timeslot, Appointment, Doctor])],
  providers: [TimeslotService],
  controllers: [TimeslotController],
  exports: [TimeslotService],
})
export class TimeslotModule {}
