import {BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Appointment} from '../common/entities/appointment.entity';
import {AppointmentNote} from '../common/entities/appointment-note.entity';
import {AppointmentStatus} from '../common/entities/appointmentStatus';
import {Client} from '../common/entities/client.entity';
import {Master} from '../common/entities/master.entity';
import {Service} from '../common/entities/service.entity';
import {WorkingHours} from '../common/entities/working-hours.entity';
import {MailService} from '../mail/mail.service';
import {CreateAppointmentDto} from './dto/create-appointment.dto';
import {AddNoteDto} from './dto/add-note.dto';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

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
        private readonly mailService: MailService,
        private readonly config: ConfigService,
    ) {
    }

    async createAppointment(userId: number, dto: CreateAppointmentDto): Promise<Appointment> {
        const client = await this.clientRepository.findOne({where: {user: {id: userId}}});
        if (!client) throw new NotFoundException('Client profile not found');

        const service = await this.serviceRepository.findOne({where: {id: dto.serviceId}});
        if (!service) throw new NotFoundException('Service not found');
        if (service.masterId !== dto.masterId) {
            throw new BadRequestException('Service does not belong to the specified master');
        }

        const startTime = new Date(dto.startTime);
        const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

        const dayOfWeek = startTime.getUTCDay();

        const workingHours = await this.workingHoursRepository.findOne({
            where: {masterId: dto.masterId, dayOfWeek},
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
            .where('a.masterId = :masterId', {masterId: dto.masterId})
            .andWhere('a.status != :cancelled', {cancelled: AppointmentStatus.CANCELLED})
            .andWhere('a.startTime < :endTime', {endTime})
            .andWhere('a.endTime > :startTime', {startTime})
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

        const saved = await this.appointmentRepository.save(appointment);
        this.logger.log(`Appointment #${saved.id} created for client ${client.id}`);

        const master = await this.masterRepository.findOne({where: {id: dto.masterId}, relations: {user: true}});
        if (client.email) {
            void this.mailService.sendAppointmentConfirmation(client.email, {
                id: saved.id,
                masterName: master?.name ?? 'Master',
                clientName: client.name,
                serviceName: service.name,
                startTime,
            });
        }

        return saved;
    }

    async getMyAppointments(userId: number, page = 1, limit = 20): Promise<{
        data: Appointment[];
        total: number;
        page: number;
        limit: number
    }> {
        const client = await this.clientRepository.findOne({where: {user: {id: userId}}});
        if (!client) throw new NotFoundException('Client profile not found');

        const [data, total] = await this.appointmentRepository.findAndCount({
            where: {clientId: client.id},
            relations: {service: true, master: true},
            order: {startTime: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });
        return {data, total, page, limit};
    }

    async cancelAppointment(userId: number, appointmentId: number): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: {id: appointmentId},
            relations: {client: {user: true}, master: {user: true}, service: true},
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
        const saved = await this.appointmentRepository.save(appointment);
        this.logger.log(`Appointment #${appointment.id} cancelled by user ${userId}`);

        const details = {
            id: appointment.id,
            masterName: appointment.master?.name ?? 'Master',
            clientName: appointment.client?.name ?? 'Client',
            serviceName: appointment.service?.name ?? '',
            startTime: appointment.startTime,
        };

        if (isClient && appointment.master?.user?.email) {
            void this.mailService.sendAppointmentCancelledByClient(appointment.master.user.email, details);
        } else if (isMaster && appointment.client?.email) {
            void this.mailService.sendAppointmentCancelledByMaster(appointment.client.email, details);
        }

        return saved;
    }

    async getMasterAppointments(
        userId: number,
        page = 1,
        limit = 20,
        status?: AppointmentStatus,
        date?: string,
    ): Promise<{ data: Appointment[]; total: number; page: number; limit: number }> {
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (!master) throw new NotFoundException('Master profile not found');

        const qb = this.appointmentRepository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.service', 'service')
            .leftJoinAndSelect('a.client', 'client')
            .where('a.masterId = :masterId', {masterId: master.id});

        if (status) qb.andWhere('a.status = :status', {status});
        if (date) {
            const start = new Date(`${date}T00:00:00.000Z`);
            const end = new Date(`${date}T23:59:59.999Z`);
            qb.andWhere('a.startTime BETWEEN :start AND :end', {start, end});
        }

        const [data, total] = await qb
            .orderBy('a.startTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {data, total, page, limit};
    }

    async updateStatus(userId: number, appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (!master) throw new NotFoundException('Master profile not found');

        const appointment = await this.appointmentRepository.findOne({where: {id: appointmentId}});
        if (!appointment) throw new NotFoundException('Appointment not found');

        if (appointment.masterId !== master.id) {
            throw new ForbiddenException('You are not allowed to update this appointment');
        }

        if (appointment.status !== AppointmentStatus.SCHEDULED) {
            throw new BadRequestException('Only scheduled appointments can be updated');
        }

        appointment.status = status;
        const saved = await this.appointmentRepository.save(appointment);
        this.logger.log(`Appointment #${appointment.id} status changed to ${status} by master ${userId}`);

        if (status === AppointmentStatus.COMPLETED) {
            const fullAppointment = await this.appointmentRepository.findOne({
                where: {id: appointmentId},
                relations: {client: {user: true}, master: true, service: true},
            });
            const clientEmail = fullAppointment?.client?.user?.email ?? fullAppointment?.client?.email;
            if (clientEmail) {
                const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
                void this.mailService.sendAppointmentCompleted(clientEmail, {
                    id: appointmentId,
                    masterName: fullAppointment?.master?.name ?? 'Master',
                    clientName: fullAppointment?.client?.name ?? 'Client',
                    serviceName: fullAppointment?.service?.name ?? 'Service',
                    startTime: fullAppointment?.startTime ?? new Date(),
                }, `${frontendUrl}/appointments/${appointmentId}/review`);
            }
        }

        return saved;
    }

    async addNote(userId: number, appointmentId: number, dto: AddNoteDto): Promise<AppointmentNote> {
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (!master) throw new NotFoundException('Master profile not found');

        const appointment = await this.appointmentRepository.findOne({where: {id: appointmentId}});
        if (!appointment) throw new NotFoundException('Appointment not found');

        if (appointment.masterId !== master.id) {
            throw new ForbiddenException('You are not allowed to add notes to this appointment');
        }

        const note = this.noteRepository.create({appointmentId, text: dto.text});
        return this.noteRepository.save(note);
    }

    async getNotes(userId: number, appointmentId: number): Promise<AppointmentNote[]> {
        const master = await this.masterRepository.findOne({where: {user: {id: userId}}});
        if (!master) throw new NotFoundException('Master profile not found');

        const appointment = await this.appointmentRepository.findOne({where: {id: appointmentId}});
        if (!appointment) throw new NotFoundException('Appointment not found');

        if (appointment.masterId !== master.id) {
            throw new ForbiddenException('You are not allowed to view notes for this appointment');
        }

        return this.noteRepository.find({
            where: {appointmentId},
            order: {createdAt: 'ASC'},
        });
    }
}
