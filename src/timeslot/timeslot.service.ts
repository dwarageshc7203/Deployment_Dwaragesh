import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Timeslot } from 'src/entities/timeslot.entity';
import { Repository } from 'typeorm';
import { Appointment } from 'src/entities/appointment.entity';
import { CreateSlotDto } from 'src/dto/CreateSlotDto';
import { Doctor } from 'src/entities/doctor.entity';
import { Not } from 'typeorm';  
import * as dayjs from 'dayjs';

@Injectable()
export class TimeslotService {
  constructor(
    @InjectRepository(Timeslot)
    private slotRepo: Repository<Timeslot>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Doctor)
private doctorRepo: Repository<Doctor>,

  ) {}

async createManualSlot(doctorId: number, dto: CreateSlotDto, userId: number) {
  const {
    start_time,
    end_time,
    date,
    patients_per_slot,
    booking_start_time,
    booking_end_time,
  } = dto;

  console.log('Received DTO:', dto);

  const start = dayjs(`${date} ${start_time}`);
  const end = dayjs(`${date} ${end_time}`);

  console.log('Parsed start:', start.toISOString(), '| Valid:', start.isValid());
  console.log('Parsed end:', end.toISOString(), '| Valid:', end.isValid());

  if (!start.isValid() || !end.isValid()) {
    throw new ConflictException('Invalid start_time or end_time');
  }

  if (end.isBefore(start)) {
    throw new ConflictException('End time must be after start time');
  }

  let bookingStart = start;
  if (booking_start_time) {
    const parsedBookingStart = dayjs(`${date} ${booking_start_time}`);
    if (parsedBookingStart.isValid()) bookingStart = parsedBookingStart;
    else throw new ConflictException('Invalid booking_start_time');
  }

  let bookingEnd = end;
  if (booking_end_time) {
    const parsedBookingEnd = dayjs(`${date} ${booking_end_time}`);
    if (parsedBookingEnd.isValid()) bookingEnd = parsedBookingEnd;
    else throw new ConflictException('Invalid booking_end_time');
  }

  console.log('Booking start:', bookingStart.toISOString(), '| Valid:', bookingStart.isValid());
  console.log('Booking end:', bookingEnd.toISOString(), '| Valid:', bookingEnd.isValid());

  if (bookingEnd.isBefore(bookingStart)) {
    throw new ConflictException('Booking end time must be after booking start time');
  }

  const slotDuration = end.diff(start, 'minute');
  if (slotDuration <= 0) {
    throw new ConflictException('Invalid slot duration');
  }

  const reporting_gap = Math.floor(slotDuration / patients_per_slot);

  console.log('Slot duration (min):', slotDuration);
  console.log('Reporting gap (min):', reporting_gap);

  const slot = this.slotRepo.create({
    doctor: { doctor_id: doctorId },
    slot_date: new Date(date),
    slot_time: start.format('HH:mm'),
    end_time: end.format('HH:mm'),
    patients_per_slot,
    booking_start_time: bookingStart.toDate(), // ✅ Correct: Date object
    booking_end_time: bookingEnd.toDate(),     // ✅ Correct: Date object
    slot_duration: slotDuration,
    reporting_gap,
  });

  console.log('Final slot to save:', slot);

  return await this.slotRepo.save(slot);
}


  async canEditOrDeleteSlot(slotId: number): Promise<void> {
    const count = await this.appointmentRepo.count({
      where: {
        time_slot: { slot_id: slotId },
        appointment_status: Not('cancelled'),
      },
    });

    if (count > 0) {
      throw new ConflictException(
        'You cannot modify this slot because an appointment is already booked in this session.',
      );
    }
  }

  async deleteSlot(slotId: number, userId: number) {
    const slot = await this.slotRepo.findOne({
      where: { slot_id: slotId },
      relations: ['doctor', 'doctor.user'],
    });

    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.doctor.user.user_id !== userId)
      throw new UnauthorizedException();

    await this.canEditOrDeleteSlot(slotId);
    return await this.slotRepo.delete(slotId);
  }

  async updateSlot(slotId: number, dto: Partial<CreateSlotDto>, userId: number) {
  const slot = await this.slotRepo.findOne({
    where: { slot_id: slotId },
    relations: ['doctor', 'doctor.user'],
  });

  if (!slot) throw new NotFoundException('Slot not found');
  if (slot.doctor.user.user_id !== userId) {
    throw new UnauthorizedException();
  }

  await this.canEditOrDeleteSlot(slotId);

  // Recalculate slot_duration and reporting_gap if relevant fields changed
  if (dto.start_time && dto.end_time && dto.patients_per_slot) {
    const slotDuration = dayjs(`${slot.slot_date} ${dto.end_time}`).diff(
      dayjs(`${slot.slot_date} ${dto.start_time}`),
      'minute',
    );
    if (slotDuration <= 0) {
      throw new ConflictException('End time must be after start time');
    }

    Object.assign(slot, dto);

slot.slot_duration = slotDuration;
slot.reporting_gap = Math.floor(slotDuration / dto.patients_per_slot);

  }

  Object.assign(slot, dto);
  return await this.slotRepo.save(slot);
}

}
