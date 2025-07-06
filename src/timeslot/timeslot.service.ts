import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as dayjs from 'dayjs';

import { Timeslot } from 'src/entities/timeslot.entity';
import { Appointment } from 'src/entities/appointment.entity';
import { CreateSlotDto } from 'src/dto/CreateSlotDto';
import { Doctor } from 'src/entities/doctor.entity';

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
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: doctorId },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    if (doctor.user.user_id !== userId)
      throw new UnauthorizedException('You are not allowed to create slot for this doctor');

    const start = dayjs(`${dto.date}T${dto.start_time}`);
    const end = dayjs(`${dto.date}T${dto.end_time}`);
    const slotDuration = end.diff(start, 'minute');

    if (slotDuration <= 0 || dto.patients_per_slot <= 0) {
      throw new BadRequestException('Invalid slot range or patients_per_slot');
    }

    const reporting_gap = Math.floor(slotDuration / dto.patients_per_slot);

    const slot = this.slotRepo.create({
      doctor,
      slot_date: dayjs(dto.date, 'YYYY-MM-DD').toDate(),
      slot_time: dto.start_time,
      end_time: dto.end_time,
      patients_per_slot: dto.patients_per_slot,
      slot_duration: slotDuration,
      reporting_gap,
      is_available: true,
      session: dto.session === 'morning' || dto.session === 'evening' ? dto.session : undefined,
      booking_start_time: dto.booking_start_time ? new Date(`${dto.date}T${dto.booking_start_time}`) : undefined,
      booking_end_time: dto.booking_end_time ? new Date(`${dto.date}T${dto.booking_end_time}`) : undefined,
    });

    await this.slotRepo.save(slot);

    return {
      message: 'Manual slot created successfully',
      slotDuration,
      reporting_gap,
    };
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
        'You cannot modify this slot because an appointment is already booked in this session.'
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
    if (slot.doctor.user.user_id !== userId)
      throw new UnauthorizedException();

    await this.canEditOrDeleteSlot(slotId);

    const dateStr = slot.slot_date.toISOString().split('T')[0];
    const start = dayjs(`${dateStr}T${dto.start_time ?? slot.slot_time}`);
    const end = dayjs(`${dateStr}T${dto.end_time ?? slot.end_time}`);

    if (dto.start_time || dto.end_time || dto.patients_per_slot) {
      if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
        throw new ConflictException('Invalid start_time or end_time');
      }

      const slotDuration = end.diff(start, 'minute');
      const reporting_gap = Math.floor(
        slotDuration / (dto.patients_per_slot ?? slot.patients_per_slot),
      );

      if (dto.start_time) slot.slot_time = start.format('HH:mm');
      if (dto.end_time) slot.end_time = end.format('HH:mm');
      if (dto.patients_per_slot) slot.patients_per_slot = dto.patients_per_slot;

      slot.slot_duration = slotDuration;
      slot.reporting_gap = reporting_gap;
    }

    if (dto.booking_start_time) {
      const parsedStart = dayjs(`${dateStr}T${dto.booking_start_time}`);
      if (!parsedStart.isValid()) throw new ConflictException('Invalid booking_start_time');
      slot.booking_start_time = parsedStart.toDate();
    }

    if (dto.booking_end_time) {
      const parsedEnd = dayjs(`${dateStr}T${dto.booking_end_time}`);
      if (!parsedEnd.isValid()) throw new ConflictException('Invalid booking_end_time');
      slot.booking_end_time = parsedEnd.toDate();
    }

    return await this.slotRepo.save(slot);
  }
}
