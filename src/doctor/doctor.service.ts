import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { In, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAvailabilityDto } from 'src/dto/availablity.dto';
import { Doctor } from 'src/entities/doctor.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { Timeslot } from 'src/entities/timeslot.entity';
import { DoctorAvailability } from 'src/entities/doctor_availablity.entity';
import { UpdateSlotDto as UpdateAvailabilityDto } from 'src/dto/update-slot.dto';
import { Appointment } from 'src/entities/appointment.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Timeslot)
    private slotRepo: Repository<Timeslot>,

    @InjectRepository(DoctorAvailability)
    private availabilityRepo: Repository<DoctorAvailability>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async getDoctors(name?: string, specialization?: string) {
    const queryBuilder = this.doctorRepo.createQueryBuilder('doctor');

    if (name) {
      queryBuilder.andWhere(
        `(LOWER(doctor.first_name) ILIKE :name OR LOWER(doctor.last_name) ILIKE :name)`,
        { name: `%${name.toLowerCase()}%` },
      );
    }

    if (specialization) {
      queryBuilder.andWhere(
        `LOWER(doctor.specialization) ILIKE :specialization`,
        { specialization: `%${specialization.toLowerCase()}%` },
      );
    }

    return queryBuilder.getMany();
  }

  async getDoctorByID(id: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: id },
      select: [
        'doctor_id',
        'first_name',
        'last_name',
        'specialization',
        'schedule_Type',
      ],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found with this id!');
    }

    return doctor;
  }

  async createAvailability(doctorId: number, dto: CreateAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: doctorId },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    const today = dayjs().startOf('day');
    const requestedDate = dayjs(dto.date);
    if (requestedDate.isBefore(today)) {
      throw new BadRequestException('Cannot create availability for a past date');
    }

    const bookingStart = dto.booking_start_time
      ? dayjs(`${dto.date}T${dto.booking_start_time}`)
      : null;
    const bookingEnd = dto.booking_end_time
      ? dayjs(`${dto.date}T${dto.booking_end_time}`)
      : null;

    if (bookingStart && !bookingStart.isValid()) {
      throw new BadRequestException('Invalid booking_start_time format');
    }
    if (bookingEnd && !bookingEnd.isValid()) {
      throw new BadRequestException('Invalid booking_end_time format');
    }

    const availability = this.availabilityRepo.create({
      doctor,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      session: dto.session,
      weekday: dto.weekday,
      booking_start_time: bookingStart?.toDate(),
      booking_end_time: bookingEnd?.toDate(),
    });

    const savedAvailability = await this.availabilityRepo.save(availability);

    const slotDuration = 30;
    const patientsPerSlot = 3;
    const reportingGap = Math.floor(slotDuration / patientsPerSlot);

    const start = dayjs(`${dto.date}T${dto.start_time}`);
    const end = dayjs(`${dto.date}T${dto.end_time}`);
    const slots: Timeslot[] = [];
    let current = start;

    while (current.isBefore(end)) {
      const next = current.add(slotDuration, 'minute');
      const slotTime = current.format('HH:mm');

      const existing = await this.slotRepo
        .createQueryBuilder('slot')
        .leftJoin('slot.doctor', 'doctor')
        .where('doctor.doctor_id = :doctorId', { doctorId })
        .andWhere('slot.slot_date = :slotDate', { slotDate: dto.date })
        .andWhere('slot.slot_time = :slotTime', { slotTime })
        .getOne();

      if (!existing) {
        const slot = this.slotRepo.create({
          doctor,
          availability: savedAvailability,
          slot_date: current.format('YYYY-MM-DD'),
          slot_time: slotTime,
          end_time: next.format('HH:mm:ss'),
          is_available: true,
          session: dto.session as 'morning' | 'evening',
          patients_per_slot: patientsPerSlot,
          slot_duration: slotDuration,
          reporting_gap: reportingGap,
          ...(bookingStart && bookingEnd
            ? {
                booking_start_time: bookingStart.toDate(),
                booking_end_time: bookingEnd.toDate(),
              }
            : {}),
        });

        slots.push(slot);
      }

      current = next;
    }

    await this.slotRepo.save(slots);

    return {
      message: 'Availability and slots created',
      total_slots: slots.length,
    };
  }

  async getAvailableSlots(doctorId: number, page: number, limit: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const today = dayjs().startOf('day').toDate();

    const [slots, total] = await this.slotRepo
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.availability', 'availability')
      .where('slot.doctor = :doctorId', { doctorId })
      .andWhere('slot.is_available = true')
      .andWhere('slot.slot_date >= :today', { today })
      .orderBy('slot.slot_date', 'ASC')
      .addOrderBy('slot.slot_time', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const grouped = slots.reduce((acc, slot) => {
      const date = new Date(slot.slot_date).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(slot.slot_time);
      return acc;
    }, {} as Record<string, string[]>);

    return {
      doctor_id: doctorId,
      total_slots: total,
      page,
      limit,
      data: grouped,
    };
  }

  async updateScheduleType(id: number, type: 'stream' | 'wave') {
    const doctor = await this.doctorRepo.findOne({ where: { doctor_id: id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.schedule_Type = type;
    return this.doctorRepo.save(doctor);
  }

  async findById(id: number) {
    return this.doctorRepo.findOne({
      where: { doctor_id: id },
      relations: ['user'],
    });
  }

  async getDoctorTimeslots(doctorId: number) {
    return this.slotRepo.find({
      where: { doctor: { doctor_id: doctorId } },
      order: { slot_time: 'ASC' },
    });
  }

  async updateAvailability(
    doctorId: number,
    id: number,
    dto: UpdateAvailabilityDto,
  ) {
    const availability = await this.availabilityRepo.findOne({
      where: { id },
      relations: ['slots', 'doctor'],
    });

    if (!availability) throw new NotFoundException('Availability not found');

    const slotTimes = availability.slots.map(s => s.slot_time);

    const count = await this.appointmentRepo.count({
      where: {
        time_slot: In(slotTimes),
        appointment_status: Not('cancelled'),
      },
    });

    if (count > 0) {
      throw new ConflictException(
        'You cannot modify this slot because an appointment is already booked in this session.',
      );
    }

    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async deleteAvailability(doctorId: number, availabilityId: number) {
    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId },
      relations: ['doctor', 'slots'],
    });

    if (!availability) throw new NotFoundException('Availability not found');
    if (availability.doctor.doctor_id !== doctorId) throw new ConflictException('Unauthorized');

    const slotTimes = availability.slots.map(slot => slot.slot_time);

    const count = await this.appointmentRepo.count({
      where: {
        time_slot: In(slotTimes),
        appointment_status: Not('cancelled'),
      },
    });

    if (count > 0) {
      throw new ConflictException('Cannot delete availability with booked appointments');
    }

    await this.slotRepo.delete({ availability: { id: availabilityId } });
    await this.availabilityRepo.delete(availabilityId);

    return { message: 'Availability and its slots deleted successfully' };
  }
}
