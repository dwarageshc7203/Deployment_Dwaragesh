import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
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
    console.log('Creating manual slot with DTO:', dto);

    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: doctorId },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.user.user_id !== userId) {
      throw new UnauthorizedException('You are not allowed to create slot for this doctor');
    }

    if (!dto.start_time || !dto.end_time) {
      throw new BadRequestException('start_time and end_time are required');
    }

    if (!dayjs(dto.date, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    }

    const start = dayjs(`${dto.date}T${dto.start_time}`);
    const end = dayjs(`${dto.date}T${dto.end_time}`);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      throw new BadRequestException('Invalid start or end time');
    }

    if (start.isBefore(dayjs().startOf('day'))) {
      throw new BadRequestException('Cannot create slots for past dates');
    }

    const slotDuration = end.diff(start, 'minute');
    if (slotDuration <= 0 || dto.patients_per_slot <= 0) {
      throw new BadRequestException('Invalid slot range or patients_per_slot');
    }

    const existingSlot = await this.slotRepo.findOne({
      where: {
        doctor: { doctor_id: doctorId },
        slot_date: start.toDate(),
        slot_time: dto.start_time,
      },
    });
    if (existingSlot) {
      throw new ConflictException('A slot at this time already exists for this doctor');
    }

    const reporting_gap = Math.floor(slotDuration / dto.patients_per_slot);

    let bookingStart: Date | undefined;
    let bookingEnd: Date | undefined;

    if (dto.booking_start_time) {
      const parsed = dayjs(`${dto.date}T${dto.booking_start_time}`);
      if (!parsed.isValid()) {
        throw new BadRequestException('Invalid booking_start_time format');
      }
      bookingStart = parsed.toDate();
    }

    if (dto.booking_end_time) {
      const parsed = dayjs(`${dto.date}T${dto.booking_end_time}`);
      if (!parsed.isValid()) {
        throw new BadRequestException('Invalid booking_end_time format');
      }
      bookingEnd = parsed.toDate();
    }

    if (bookingStart && bookingEnd && dayjs(bookingEnd).isBefore(bookingStart)) {
      throw new BadRequestException('booking_end_time must be after booking_start_time');
    }

    const slot = this.slotRepo.create({
      doctor,
      slot_date: start.toDate(),
      slot_time: dto.start_time,
      end_time: dto.end_time,
      patients_per_slot: dto.patients_per_slot,
      slot_duration: slotDuration,
      reporting_gap,
      is_available: true,
      session: dto.session,
      booking_start_time: bookingStart,
      booking_end_time: bookingEnd,
    });

    await this.slotRepo.save(slot);

    console.log('Manual slot created successfully:', slot);

    return {
      message: 'Manual slot created successfully',
      slotDuration,
      reporting_gap,
    };
  }

  async canEditOrDeleteSlot(slotId: number): Promise<void> {
    const slot = await this.slotRepo.findOne({ where: { slot_id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');

    const count = await this.appointmentRepo.count({
      where: {
        time_slot: slot,
        appointment_status: Not('cancelled'),
      },
    });

    if (count > 0) {
      throw new ConflictException(
        'You cannot modify this slot because an appointment is already booked in this session.',
      );
    }
  }

async deleteSlot(doctorId: number, slotId: number) {
  const slot = await this.slotRepo.findOne({
    where: { slot_id: slotId, doctor: { doctor_id: doctorId } },
    relations: ['doctor', 'availability'],
  });

  if (!slot) {
    throw new NotFoundException('Slot not found for this doctor.');
  }

  // If this slot is linked to an availability (i.e. a session window)
  const availability = slot.availability;

  if (availability) {
    const hasAppointmentsInSession = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin('appointment.time_slot', 'slot')
      .leftJoin('slot.availability', 'availability')
      .where('availability.id = :id', { id: availability.id })
      .andWhere('appointment.appointment_status != :status', { status: 'cancelled' })
      .getCount();

    if (hasAppointmentsInSession > 0) {
      throw new BadRequestException(
        'Cannot delete slot: Appointments exist in the consulting session.',
      );
    }
  } else {
    // Manual slot (no availability group)
    const hasAppointments = await this.appointmentRepo.exist({
      where: {
        time_slot: { slot_id: slotId },
        appointment_status: Not('cancelled'),
      },
    });

    if (hasAppointments) {
      throw new BadRequestException(
        'Cannot delete slot: Appointments exist for this timeslot.',
      );
    }
  }

  try {
    await this.slotRepo.remove(slot);
  } catch (error) {
    if (error.code === '23503') {
      throw new BadRequestException(
        'Slot cannot be deleted because appointments still reference it.',
      );
    }
    console.error('Error deleting slot:', error);
    throw new InternalServerErrorException('Something went wrong.');
  }

  console.log(`Slot ${slotId} deleted successfully for doctor ${doctorId}`);
  return { message: 'Timeslot deleted successfully.' };
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

    const dateStr = dayjs(slot.slot_date).format('YYYY-MM-DD');
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

    const updated = await this.slotRepo.save(slot);
    console.log('Slot updated:', updated);

    return updated;
  }

  async getAllSlotsForDoctor(doctorId: number) {
    const slots = await this.slotRepo.find({
      where: { doctor: { doctor_id: doctorId } },
      order: { slot_date: 'ASC', slot_time: 'ASC' },
      relations: ['doctor'],
    });

    return {
      doctor_id: doctorId,
      total_slots: slots.length,
      data: slots.map((slot) => ({
        slot_id: slot.slot_id,
        date: slot.slot_date.toISOString().split('T')[0],
        slot_time: slot.slot_time,
        end_time: slot.end_time,
        session: slot.session,
        booking_start_time: slot.booking_start_time?.toISOString(),
        booking_end_time: slot.booking_end_time?.toISOString(),
        patients_per_slot: slot.patients_per_slot,
        is_available: slot.is_available,
      })),
    };
  }
}
