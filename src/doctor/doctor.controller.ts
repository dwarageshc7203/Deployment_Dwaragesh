// src/doctor/doctor.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  Delete
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateAvailabilityDto } from 'src/dto/availablity.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateSlotDto as UpdateAvailabilityDto } from 'src/dto/update-slot.dto';
import { TimeslotService } from 'src/timeslot/timeslot.service';

@Controller('api/v1/doctors')
export class DoctorController {
  constructor(private doctorService: DoctorService,
      private timeslotService: TimeslotService // ✅ Inject here

  ){}

  @UseGuards(JwtAuthGuard)
  @Get()
  getDoctors(
    @Query('name') name?: string,
    @Query('specialization') specialization?: string,
  ) {
    return this.doctorService.getDoctors(name, specialization);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getDoctorByID(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.getDoctorByID(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  @Post(':id/availability')
  async createAvailability(
    @Param('id') doctorId: number,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.doctorService.createAvailability(doctorId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/availability')
  async getAvailability(
    @Param('id') doctorId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.doctorService.getAvailableSlots(doctorId, +page, +limit);
  }

  @Patch(':id/schedule_Type')
@Roles('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
async updateScheduleType(
  @Param('id') id: number,
  @Body() body: { schedule_Type: 'stream' | 'wave' },
  @Req() req: any,
) {
  const userId = req.user.sub;
  const doctor = await this.doctorService.findById(+id);

  if (!doctor || !doctor.user || doctor.user.user_id !== userId) {
    throw new ForbiddenException('You can only update your own schedule type');
  }

  return this.doctorService.updateScheduleType(+id, body.schedule_Type);
}

@UseGuards(JwtAuthGuard)
@Get(':id/timeslots')
async getDoctorTimeslots(@Param('id', ParseIntPipe) doctorId: number) {
  return this.doctorService.getDoctorTimeslots(doctorId);
}

// Shortened view: only new/important part shown
@Patch(':doctorId/availability/:id')
async updateAvailability(
  @Param('doctorId') doctorId: number,
  @Param('id') id: number,
  @Body() dto: UpdateAvailabilityDto,
) {
  return this.doctorService.updateAvailability(doctorId, id, dto);
}

@Get(':id/slots')
  async getSlotsForDoctor(@Param('id') doctorId: number) {
    return this.timeslotService.getAllSlotsForDoctor(+doctorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
@Delete(':doctorId/availability/:id')
async deleteAvailability(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('id', ParseIntPipe) availabilityId: number,
  @Req() req: any
) {
  const userId = req.user.sub;
  const doctor = await this.doctorService.findById(doctorId);

  if (!doctor || doctor.user.user_id !== userId) {
    throw new ForbiddenException('You can only delete your own availability');
  }

  return this.doctorService.deleteAvailability(doctorId, availabilityId);
}


}
