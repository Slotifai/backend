import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../common/entities/appointment.entity';
import { AppointmentNote } from '../common/entities/appointment-note.entity';
import { AppointmentStatus } from '../common/entities/appointmentStatus';
import { Client } from '../common/entities/client.entity';
import { Master } from '../common/entities/master.entity';
import { Service } from '../common/entities/service.entity';
import { WorkingHours } from '../common/entities/working-hours.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AddNoteDto } from './dto/add-note.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentNote)
    private readonly noteRepository: Repository<AppointmentNote>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Master)
    private readonly masterRepository: Repository<Master>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(WorkingHours)
    private readonly workingHoursRepository: Repository<WorkingHours>,
  ) {}

  async createAppointment(userId: number, dto: CreateAppointmentDto): Promise<Appointment> {
    const client = await this.clientRepository.findOne({ where: { user: { id: userId } } });
    if (!client) throw new NotFoundException('Client profile not found');

    const service = await this.serviceRepository.findOne({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.masterId !== dto.masterId) {
      throw new BadRequestException('Service does not belong to the specified master');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    const dayOfWeek = startTime.getDay();

    const workingHours = await this.workingHoursRepository.findOne({
      where: { masterId: dto.masterId, dayOfWeek },
    });

    if (!workingHours) {
      throw new BadRequestException('Master has no working hours set for this day');
    }

    if (workingHours.isDayOff) {
      throw new BadRequestException('Master is not working on this day');
    }

    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
    const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
    const workStart = toMinutes(workingHours.startTime);
    const workEnd = toMinutes(workingHours.endTime);

    if (startMinutes < workStart || endMinutes > workEnd) {
      throw new BadRequestException('Appointment time is outside master working hours');
    }

    const overlapping = await this.appointmentRepository
      .createQueryBuilder('a')
      .where('a.masterId = :masterId', { masterId: dto.masterId })
      .andWhere('a.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .andWhere('a.startTime < :endTime', { endTime })
      .andWhere('a.endTime > :startTime', { startTime })
      .getOne();

    if (overlapping) {
      throw new BadRequestException('This time slot is already booked');
    }

    const appointment = this.appointmentRepository.create({
      clientId: client.id,
      masterId: dto.masterId,
      serviceId: dto.serviceId,
      startTime,
      endTime,
      status: AppointmentStatus.SCHEDULED,
    });

    return this.appointmentRepository.save(appointment);
  }

  async getMyAppointments(userId: number): Promise<Appointment[]> {
    const client = await this.clientRepository.findOne({ where: { user: { id: userId } } });
    if (!client) throw new NotFoundException('Client profile not found');

    return this.appointmentRepository.find({
      where: { clientId: client.id },
      relations: { service: true, master: true },
      order: { startTime: 'DESC' },
    });
  }

  async cancelAppointment(userId: number, appointmentId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: { client: { user: true }, master: { user: true } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const isClient = appointment.client?.user?.id === userId;
    const isMaster = appointment.master?.user?.id === userId;

    if (!isClient && !isMaster) {
      throw new ForbiddenException('You are not allowed to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepository.save(appointment);
  }

  async getMasterAppointments(userId: number): Promise<Appointment[]> {
    const master = await this.masterRepository.findOne({ where: { user: { id: userId } } });
    if (!master) throw new NotFoundException('Master profile not found');

    return this.appointmentRepository.find({
      where: { masterId: master.id },
      relations: { service: true, client: true },
      order: { startTime: 'DESC' },
    });
  }

  async updateStatus(userId: number, appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
    const master = await this.masterRepository.findOne({ where: { user: { id: userId } } });
    if (!master) throw new NotFoundException('Master profile not found');

    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.masterId !== master.id) {
      throw new ForbiddenException('You are not allowed to update this appointment');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be updated');
    }

    appointment.status = status;
    return this.appointmentRepository.save(appointment);
  }

  async addNote(userId: number, appointmentId: number, dto: AddNoteDto): Promise<AppointmentNote> {
    const master = await this.masterRepository.findOne({ where: { user: { id: userId } } });
    if (!master) throw new NotFoundException('Master profile not found');

    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.masterId !== master.id) {
      throw new ForbiddenException('You are not allowed to add notes to this appointment');
    }

    const note = this.noteRepository.create({ appointmentId, text: dto.text });
    return this.noteRepository.save(note);
  }

  async getNotes(userId: number, appointmentId: number): Promise<AppointmentNote[]> {
    const master = await this.masterRepository.findOne({ where: { user: { id: userId } } });
    if (!master) throw new NotFoundException('Master profile not found');

    const appointment = await this.appointmentRepository.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.masterId !== master.id) {
      throw new ForbiddenException('You are not allowed to view notes for this appointment');
    }

    return this.noteRepository.find({
      where: { appointmentId },
      order: { createdAt: 'ASC' },
    });
  }
}
