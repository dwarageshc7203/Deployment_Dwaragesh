import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { Appointment } from 'src/entities/appointment.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { Patient } from 'src/entities/patient.entity';
import { CreateAppointmentDto } from 'src/dto/CreateAppointmentDto';
import { Timeslot } from 'src/entities/timeslot.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Timeslot)
    private timeslotRepo: Repository<Timeslot>,
  ) {}

  async bookAppointment(dto: CreateAppointmentDto, patientId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: dto.doctor_id },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const slot = await this.timeslotRepo.findOne({
      where: { slot_id: dto.slot_id },
      relations: ['doctor', 'availability'],
    });

    if (!slot || slot.doctor.doctor_id !== dto.doctor_id) {
      throw new NotFoundException('Invalid slot for this doctor');
    }

    const bookingStart = slot.availability?.booking_start_time ?? slot.booking_start_time;
    const bookingEnd = slot.availability?.booking_end_time ?? slot.booking_end_time;

    if (!bookingStart || !bookingEnd) {
      throw new ConflictException('Slot booking window not set');
    }

    const now = dayjs().utc();

    if (now.isBefore(bookingStart) || now.isAfter(bookingEnd)) {
      throw new ForbiddenException('You can only book within the allowed booking window.');
    }

    const appointmentDate = dayjs(slot.slot_date);
    if (!appointmentDate.isValid()) {
      throw new ConflictException('Invalid appointment date');
    }

    if (appointmentDate.isBefore(dayjs().startOf('day'))) {
      throw new ConflictException('Cannot book an appointment in the past');
    }

    if (!slot.slot_time) {
      throw new ConflictException('Invalid appointment time');
    }

    const session = slot.session ?? dto.session;
    if (!session || !['morning', 'evening'].includes(session)) {
      throw new ConflictException('Invalid session: must be "morning" or "evening"');
    }

    const existing = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin('appointment.time_slot_ref', 'slot')
      .where('slot.slot_id = :slotId', { slotId: slot.slot_id })
      .andWhere('appointment.appointment_status != :status', { status: 'cancelled' })
      .orderBy('appointment.created_at', 'ASC')
      .getMany();

      // Extract patientsPerSlot
const patientsPerSlot =
  slot.patients_per_slot ?? doctor.patients_per_slot ?? 1;

if (existing.length >= patientsPerSlot) {
  throw new ConflictException('This slot is already fully booked');
}


    let reportingTime = slot.slot_time;

    if (doctor.schedule_Type === 'stream') {
      if (existing.length > 0) {
        throw new ConflictException('Slot already booked');
      }
    }

    if (doctor.schedule_Type === 'wave') {
      const slotDuration = doctor.slot_duration ?? 30;
      const patientsPerSlot = doctor.patients_per_slot ?? 3;

      if (existing.length >= patientsPerSlot) {
        throw new ConflictException('Wave slot is full');
      }

      const base = dayjs(`${slot.slot_date} ${slot.slot_time}`);
      const gap = Math.floor(slotDuration / patientsPerSlot);
      reportingTime = base.add(gap * existing.length, 'minute').format('HH:mm');
    }

    const patient = await this.patientRepo.findOne({
      where: { user: { user_id: patientId } },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const existingSessionBooking = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin('appointment.patient', 'patient')
      .leftJoin('appointment.time_slot_ref', 'slot') // ✅ use the correct relation name
      .leftJoin('slot.doctor', 'doctor')
      .where('patient.patient_id = :patientId', { patientId: patient.patient_id })
      .andWhere('doctor.doctor_id = :doctorId', { doctorId: dto.doctor_id })
      .andWhere('slot.slot_date = :date', { date: slot.slot_date })
      .andWhere('slot.session = :session', { session })
      .andWhere('appointment.appointment_status != :status', { status: 'cancelled' })
      .getOne();

    if (existingSessionBooking) {
      throw new ConflictException(
        `You already have an appointment with this doctor in the ${session} session on ${slot.slot_date}`,
      );
    }
console.log('Slot:', slot);
console.log('Slot ID:', slot?.slot_id);

    // FIXED: Create appointment with proper field mapping
const appointment = this.appointmentRepo.create({
  appointment_date: appointmentDate.toDate(),
  session,
  appointment_status: 'confirmed',
  reason: dto.reason,
  notes: dto.notes,
  reporting_time: reportingTime,
  time_slot: slot.slot_time, // plain column
  time_slot_ref: slot,       // ✅ relation (very important)
  doctor,
  patient,
});

    await this.appointmentRepo.save(appointment);
  }

  async getAppointmentsByDoctorAndDate(doctorId: number, date?: string) {
    const whereClause: any = {
      doctor: { doctor_id: doctorId },
      appointment_status: Not('cancelled'),
    };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      whereClause.appointment_date = Between(dayStart, dayEnd);
    }

    return this.appointmentRepo.find({
      where: whereClause,
      relations: ['doctor', 'patient', 'time_slot'], // time_slot is the relationship name
      order: { appointment_date: 'ASC' },
    });
  }

  async getAppointments(user: any, date?: string) {
    const whereClause: any = {
      appointment_status: Not('cancelled'),
    };

    if (user.role === 'doctor') {
      whereClause.doctor = { doctor_id: user.doctor_id };
    } else if (user.role === 'patient') {
      whereClause.patient = { patient_id: user.patient_id };
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      whereClause.appointment_date = Between(start, end);
    }

    return this.appointmentRepo.find({
      where: whereClause,
      relations: ['doctor', 'patient', 'time_slot'], // time_slot is the relationship name
      order: { appointment_date: 'ASC' },
    });
  }

  async cancelAppointment(appointmentId: number, userId: number, role: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { appointment_id: appointmentId },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.appointment_status === 'cancelled') {
      return { message: 'Appointment is already cancelled' };
    }

    const isDoctor = appointment.doctor?.user?.user_id === userId;
    const isPatient = appointment.patient?.user?.user_id === userId;

    if ((role === 'doctor' && !isDoctor) || (role === 'patient' && !isPatient)) {
      throw new UnauthorizedException(
        'You are not authorized to cancel this appointment',
      );
    }

    await this.appointmentRepo.update(appointmentId, {
      appointment_status: 'cancelled',
    });

    return { message: 'Appointment cancelled successfully' };
  }

  async getPatientAppointments(patientUserId: number, type: string) {
  const patient = await this.patientRepo.findOne({
    where: { user: { user_id: patientUserId } },
  });
  if (!patient) throw new NotFoundException('Patient not found');

  const query = this.appointmentRepo
    .createQueryBuilder('appointment')
    .leftJoinAndSelect('appointment.doctor', 'doctor')
    .leftJoinAndSelect('appointment.time_slot', 'slot')
    .where('appointment.patient = :patientId', { patientId: patient.patient_id });

  if (type === 'upcoming') {
    query.andWhere('appointment.appointment_status = :status', { status: 'confirmed' });
    query.andWhere('appointment.appointment_date >= CURRENT_DATE');
  } else if (type === 'past') {
    query.andWhere('appointment.appointment_status = :status', { status: 'confirmed' });
    query.andWhere('appointment.appointment_date < CURRENT_DATE');
  } else if (type === 'cancelled') {
    query.andWhere('appointment.appointment_status = :status', { status: 'cancelled' });
  } else {
    throw new BadRequestException('Invalid type. Use: upcoming | past | cancelled');
  }

  return query.orderBy('appointment.appointment_date', 'ASC').getMany();
}
async getDoctorAppointments(doctorUserId: number, type: string) {
  const doctor = await this.doctorRepo.findOne({
    where: { user: { user_id: doctorUserId } },
  });
  if (!doctor) throw new NotFoundException('Doctor not found');

  const query = this.appointmentRepo
    .createQueryBuilder('appointment')
    .leftJoinAndSelect('appointment.patient', 'patient')
    .leftJoinAndSelect('appointment.time_slot', 'slot')
    .where('appointment.doctor = :doctorId', { doctorId: doctor.doctor_id });

  if (type === 'upcoming') {
    query.andWhere('appointment.appointment_status = :status', { status: 'confirmed' });
    query.andWhere('appointment.appointment_date >= CURRENT_DATE');
  } else if (type === 'past') {
    query.andWhere('appointment.appointment_status = :status', { status: 'confirmed' });
    query.andWhere('appointment.appointment_date < CURRENT_DATE');
  } else if (type === 'cancelled') {
    query.andWhere('appointment.appointment_status = :status', { status: 'cancelled' });
  } else {
    throw new BadRequestException('Invalid type. Use: upcoming | past | cancelled');
  }

  return query.orderBy('appointment.appointment_date', 'ASC').getMany();
}

}