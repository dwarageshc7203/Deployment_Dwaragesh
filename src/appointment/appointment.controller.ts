import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from 'src/dto/CreateAppointmentDto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('api/v1/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @Roles('patient')
  bookAppointment(@Body() dto: CreateAppointmentDto, @Req() req) {
    console.log('🆔 Patient user_id from JWT:', req.user.sub);
    return this.appointmentService.bookAppointment(dto, req.user.sub); // use sub as userId
  }
  
  @Get('/doctor/by-date')
  @Roles('doctor')
  getAppointmentsByDoctorAndDate(
    @Query('doctor_id') doctorId: number,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.getAppointmentsByDoctorAndDate(doctorId, date);
  }

  @Get()
  @Roles('doctor', 'patient')
  getAppointments(@Req() req, @Query('date') date?: string) {
    return this.appointmentService.getAppointments(req.user, date);
  }

  @Patch(':id/cancel')
  @Roles('patient', 'doctor')
  cancelAppointment(@Param('id') id: number, @Req() req) {
    return this.appointmentService.cancelAppointment(+id, req.user.sub, req.user.role);
  }

  @Get('/patient')
@Roles('patient')
getPatientAppointments(
  @Req() req,
  @Query('type') type: 'upcoming' | 'past' | 'cancelled',
) {
  return this.appointmentService.getPatientAppointments(req.user.sub, type);
}

@Get('/doctor')
@Roles('doctor')
getDoctorAppointments(
  @Req() req,
  @Query('type') type: 'upcoming' | 'past' | 'cancelled',
) {
  return this.appointmentService.getDoctorAppointments(req.user.sub, type);
}

}
