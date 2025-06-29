import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';

import { Appointment } from 'src/entities/appointment.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { Patient } from 'src/entities/patient.entity';
import { CreateAppointmentDto } from 'src/dto/CreateAppointmentDto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async bookAppointment(dto: CreateAppointmentDto, patientId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { doctor_id: dto.doctor_id },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const appointmentDate = dayjs(dto.slot_date);
    if (!appointmentDate.isValid()) {
      throw new ConflictException('Invalid appointment date');
    }

    if (appointmentDate.isBefore(dayjs().startOf('day'))) {
      throw new ConflictException('Cannot book an appointment in the past');
    }

    if (!dto.slot_time) {
      throw new ConflictException('Invalid appointment time');
    }

    const existing = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin('appointment.doctor', 'doctor')
      .where('doctor.doctor_id = :doctorId', { doctorId: dto.doctor_id })
      .andWhere('appointment.appointment_date = :date', { date: dto.slot_date })
      .andWhere('appointment.time_slot = :slot', { slot: dto.slot_time })
      .getMany();

    if (doctor.schedule_Type === 'stream' && existing.length > 0) {
      throw new ConflictException('Slot already booked');
    }

    if (doctor.schedule_Type === 'wave' && existing.length >= 3) {
      throw new ConflictException('Wave slot is full');
    }

    const patient = await this.patientRepo.findOne({
      where: { patient_id: patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      appointment_date: dto.slot_date,
      time_slot: dto.slot_time,
      appointment_status: 'confirmed',
      reason: dto.reason || '',
      notes: dto.notes || '',
    });

    const saved = await this.appointmentRepo.save(appointment);
    console.log('✅ Appointment saved:', saved);
    return saved;
  }

  async getAppointmentsByDoctorAndDate(doctorId: number, date?: string) {
    const whereClause: any = {
      doctor: { doctor_id: doctorId },
    };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      whereClause.appointment_date = Between(dayStart, dayEnd);
    }

    const appointments = await this.appointmentRepo.find({
      where: whereClause,
      relations: ['doctor', 'patient'],
      order: { appointment_date: 'ASC' },
    });

    return appointments;
  }

  async getAppointments(user: any, date?: string) {
    const whereClause: any = {};

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
      relations: ['doctor', 'patient'],
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

    const isDoctor = appointment.doctor?.user?.user_id === userId;
    const isPatient = appointment.patient?.user?.user_id === userId;

    if ((role === 'doctor' && !isDoctor) || (role === 'patient' && !isPatient)) {
      throw new UnauthorizedException(
        'You are not authorized to cancel this appointment',
      );
    }

    appointment.appointment_status = 'cancelled';
    await this.appointmentRepo.save(appointment);

    return { message: 'Appointment cancelled successfully' };
  }
}
