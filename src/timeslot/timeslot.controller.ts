import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Patch,
  Req,
  Get
} from '@nestjs/common';
import { TimeslotService } from './timeslot.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateSlotDto } from 'src/dto/CreateSlotDto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/doctors/:doctorId/slots')
export class TimeslotController {
  constructor(private readonly timeslotService: TimeslotService) {}

  @Post()
@Roles('doctor')
createSlot(
  @Param('doctorId') doctorId: number,
  @Body() dto: CreateSlotDto,
  @Req() req,
) {
  return this.timeslotService.createManualSlot(doctorId, dto, req.user.sub);
}


  @Patch(':slotId')
  @Roles('doctor')
  updateSlot(
    @Param('doctorId') doctorId: number,
    @Param('slotId') slotId: number,
    @Body() dto: Partial<CreateSlotDto>,
    @Req() req,
  ) {
    return this.timeslotService.updateSlot(slotId, dto, req.user.sub);
  }

  @Delete(':slotId')
  @Roles('doctor')
  deleteSlot(
    @Param('doctorId') doctorId: number,
    @Param('slotId') slotId: number,
    @Req() req,
  ) {
    return this.timeslotService.deleteSlot(slotId, req.user.sub);
  }

    @Get('doctors/:id/slots')
  async getSlotsForDoctor(@Param('id') doctorId: number) {
    return this.timeslotService.getAllSlotsForDoctor(+doctorId);
  }
}
