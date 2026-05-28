import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards} from '@nestjs/common';
import {ApiBearerAuth, ApiQuery, ApiTags} from '@nestjs/swagger';
import {AppointmentStatus} from '../common/entities/appointmentStatus';
import {AppointmentsService} from './appointments.service';
import {CreateAppointmentDto} from './dto/create-appointment.dto';
import {AddNoteDto} from './dto/add-note.dto';
import {UpdateStatusDto} from './dto/update-status.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {RolesGuard} from '../auth/guards/roles.guard';
import {Roles} from '../auth/decorators/roles.decorator';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {UserRole} from '../common/enums/user-role';
import {User} from '../common/entities/user.entity';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {
    }

    @Roles(UserRole.CLIENT)
    @Post()
    createAppointment(@CurrentUser() user: User, @Body() dto: CreateAppointmentDto) {
        return this.appointmentsService.createAppointment(user.id, dto);
    }

    @Roles(UserRole.CLIENT)
    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiQuery({name: 'status', required: false, enum: AppointmentStatus})
    @Get('my')
    getMyAppointments(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: AppointmentStatus,
    ) {
        return this.appointmentsService.getMyAppointments(user.id, page ? +page : 1, limit ? +limit : 20, status);
    }

    @Roles(UserRole.CLIENT, UserRole.MASTER)
    @Patch(':id/cancel')
    cancelAppointment(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
        return this.appointmentsService.cancelAppointment(user.id, id);
    }

    @Roles(UserRole.MASTER)
    @ApiQuery({name: 'page', required: false, type: Number})
    @ApiQuery({name: 'limit', required: false, type: Number})
    @ApiQuery({name: 'status', required: false, enum: AppointmentStatus})
    @ApiQuery({name: 'date', required: false, type: String, description: 'YYYY-MM-DD'})
    @Get('master')
    getMasterAppointments(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: AppointmentStatus,
        @Query('date') date?: string,
    ) {
        return this.appointmentsService.getMasterAppointments(user.id, page ? +page : 1, limit ? +limit : 20, status, date);
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

    @Roles(UserRole.MASTER, UserRole.CLIENT)
    @Get(':id')
    getAppointment(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
        return this.appointmentsService.getAppointment(user.id, id);
    }

    @Roles(UserRole.MASTER)
    @Get(':id/notes')
    getNotes(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
        return this.appointmentsService.getNotes(user.id, id);
    }
}
