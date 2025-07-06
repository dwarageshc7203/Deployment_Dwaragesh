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

  const start = dayjs(`${date} ${start_time}`);
  const end = dayjs(`${date} ${end_time}`);

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

  if (bookingEnd.isBefore(bookingStart)) {
    throw new ConflictException('Booking end time must be after booking start time');
  }

  const slotDuration = end.diff(start, 'minute');
  if (slotDuration <= 0) {
    throw new ConflictException('Invalid slot duration');
  }

  const reporting_gap = Math.floor(slotDuration / patients_per_slot);

  const slot = this.slotRepo.create({
    doctor: { doctor_id: doctorId },
    slot_date: start.toDate(),
    slot_time: start.format('HH:mm'),
    end_time: end.format('HH:mm'),
    patients_per_slot,
    booking_start_time: bookingStart.format('HH:mm'), // ⬅️ Use this if column is `time`
    booking_end_time: bookingEnd.format('HH:mm'),     // ⬅️ Use this if column is `time`
    slot_duration: slotDuration,
    reporting_gap,
  });

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

  if (dto.start_time && dto.end_time && dto.patients_per_slot) {
    const start = dayjs(`${slot.slot_date} ${dto.start_time}`);
    const end = dayjs(`${slot.slot_date} ${dto.end_time}`);

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      throw new ConflictException('Invalid start_time or end_time');
    }

    const slotDuration = end.diff(start, 'minute');
    const reporting_gap = Math.floor(slotDuration / dto.patients_per_slot);

    slot.slot_time = dto.start_time;
    slot.end_time = dto.end_time;
    slot.patients_per_slot = dto.patients_per_slot;
    slot.slot_duration = slotDuration;
    slot.reporting_gap = reporting_gap;
  }

  if (dto.booking_start_time) {
    slot.booking_start_time = dayjs(`${slot.slot_date} ${dto.booking_start_time}`).toDate();
  }

  if (dto.booking_end_time) {
    slot.booking_end_time = dayjs(`${slot.slot_date} ${dto.booking_end_time}`).toDate();
  }

  return await this.slotRepo.save(slot);
}


}
