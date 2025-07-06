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

async createManualSlot(
  doctorId: number,
  dto: CreateSlotDto,
  userId: number,
): Promise<Timeslot> {
  const {
    start_time,
    end_time,
    date,
    patients_per_slot,
    booking_start_time,
    booking_end_time,
  } = dto;

  const start = dayjs(`${date} ${start_time}`, 'YYYY-MM-DD HH:mm');
  const end = dayjs(`${date} ${end_time}`, 'YYYY-MM-DD HH:mm');

  if (!start.isValid() || !end.isValid()) {
    throw new ConflictException('Invalid start_time or end_time format');
  }

  if (end.isBefore(start)) {
    throw new ConflictException('End time must be after start time');
  }

  // Use booking times if valid, else fallback to start/end
  let bookingStart = booking_start_time
    ? dayjs(`${date} ${booking_start_time}`, 'YYYY-MM-DD HH:mm')
    : start;

  if (!bookingStart.isValid()) bookingStart = start;

  let bookingEnd = booking_end_time
    ? dayjs(`${date} ${booking_end_time}`, 'YYYY-MM-DD HH:mm')
    : end;

  if (!bookingEnd.isValid()) bookingEnd = end;

  if (bookingEnd.isBefore(bookingStart)) {
    throw new ConflictException('Booking end time must be after booking start time');
  }

  const slotDuration = end.diff(start, 'minute');
  if (slotDuration <= 0) {
    throw new ConflictException('Slot duration must be greater than zero');
  }

  if (patients_per_slot <= 0) {
    throw new ConflictException('patients_per_slot must be greater than 0');
  }

  const reporting_gap = Math.floor(slotDuration / patients_per_slot);

  const slot = this.slotRepo.create({
    doctor: { doctor_id: doctorId },
    slot_date: date,
    slot_time: start.format('HH:mm'),
    end_time: end.format('HH:mm'),
    patients_per_slot,
    booking_start_time: bookingStart.format('HH:mm'),
    booking_end_time: bookingEnd.format('HH:mm'),
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
