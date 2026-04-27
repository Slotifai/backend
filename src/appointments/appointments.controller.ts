import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role';
import { User } from '../common/entities/user.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.CLIENT)
  @Post()
  createAppointment(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(user.id, dto);
  }

  @Roles(UserRole.CLIENT)
  @Get('my')
  getMyAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.getMyAppointments(user.id);
  }

  @Roles(UserRole.CLIENT, UserRole.MASTER)
  @Patch(':id/cancel')
  cancelAppointment(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancelAppointment(user.id, id);
  }

  @Roles(UserRole.MASTER)
  @Get('master')
  getMasterAppointments(@CurrentUser() user: User) {
    return this.appointmentsService.getMasterAppointments(user.id);
  }

  @Roles(UserRole.MASTER)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(user.id, id, dto.status);
  }

  @Roles(UserRole.MASTER)
  @Post(':id/notes')
  addNote(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddNoteDto,
  ) {
    return this.appointmentsService.addNote(user.id, id, dto);
  }

  @Roles(UserRole.MASTER)
  @Get(':id/notes')
  getNotes(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.getNotes(user.id, id);
  }
}
